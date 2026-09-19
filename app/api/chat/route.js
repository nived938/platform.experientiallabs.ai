import {NextResponse} from "next/server";

const PRIMARY_MODEL = "z-ai/glm-5.2:free";
const FALLBACK_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "openai/gpt-oss-120b:free"
];

export async function POST(req){
  const key=process.env.OPENROUTER_API_KEY;
  if(!key){
    return NextResponse.json(
      {error:"OPENROUTER_API_KEY is not configured on the server."},
      {status:500}
    );
  }

  try{
    const {messages}=await req.json();

    if(!Array.isArray(messages)||!messages.length){
      return NextResponse.json({error:"Messages are required."},{status:400});
    }

    const clean=messages.map(m=>({
      role:m.role,
      content:String(m.content)
    }));

    const models=[PRIMARY_MODEL,...FALLBACK_MODELS];
    let lastError=null;

    for(let i=0;i<models.length;i++){
      const model=models[i];

      const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",
        headers:{
          "Authorization":"Bearer "+key,
          "Content-Type":"application/json",
          "HTTP-Referer":"https://platform.experientiallabs.ai",
          "X-Title":"Experiential AI Chat"
        },
        body:JSON.stringify({
          model,
          messages:clean,
          stream:false
        })
      });

      const data=await res.json().catch(()=>({}));

      if(res.ok){
        const content=data?.choices?.[0]?.message?.content;

        if(!content){
          lastError={
            error:"OpenRouter returned an empty response.",
            model
          };
          continue;
        }

        return NextResponse.json({
          content,
          model,
          usedFallback:i>0,
          fallbackFrom:i>0?PRIMARY_MODEL:null,
          usage:data?.usage||null,
          requestId:res.headers.get("x-request-id")
        });
      }

      const providerError=data?.error?.message||"OpenRouter request failed.";
      lastError={
        error:providerError,
        code:data?.error?.code||String(res.status),
        model,
        status:res.status,
        retryAfter:res.headers.get("retry-after")
      };

      // Only fail over for temporary availability/rate-limit errors.
      // Authentication, invalid requests, and other permanent errors should
      // be shown immediately instead of sending the same invalid request
      // to several models.
      if(res.status!==429 && res.status!==408 && res.status!==502 && res.status!==503 && res.status!==504){
        break;
      }
    }

    if(lastError?.status===429){
      const retryAfter=lastError.retryAfter;
      const wait=retryAfter
        ? ` Try again in about ${retryAfter} seconds.`
        : " Please wait and try again later.";

      return NextResponse.json({
        error:`All configured free OpenRouter models are currently rate limited.${wait}`,
        code:"ALL_MODELS_RATE_LIMITED",
        attemptedModels:models
      },{status:429});
    }

    return NextResponse.json({
      error:lastError?.error||"All configured OpenRouter models failed.",
      code:lastError?.code||"OPENROUTER_ERROR",
      attemptedModels:models
    },{status:lastError?.status||502});
  }catch(e){
    return NextResponse.json({
      error:e instanceof Error?e.message:"Unexpected server error."
    },{status:500});
  }
}
