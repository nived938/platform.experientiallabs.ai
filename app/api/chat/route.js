import {NextResponse} from "next/server";

const MODEL = "z-ai/glm-5.2:free";

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

    const res=await fetch("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+key,
        "Content-Type":"application/json",
        "HTTP-Referer":"https://platform.experientiallabs.ai",
        "X-Title":"Experiential AI Chat"
      },
      body:JSON.stringify({
        model:MODEL,
        messages:clean,
        stream:false
      })
    });

    const data=await res.json().catch(()=>({}));

    if(!res.ok){
      if(res.status===429){
        const retryAfter=res.headers.get("retry-after");
        const wait=retryAfter
          ? ` Try again in about ${retryAfter} seconds.`
          : " Please wait and try again later.";

        return NextResponse.json({
          error:`OpenRouter rate limit reached for ${MODEL}.${wait} Free OpenRouter models have usage limits.`,
          code:"RATE_LIMITED",
          retryAfter:retryAfter||null,
          model:MODEL
        },{status:429});
      }

      return NextResponse.json({
        error:data?.error?.message||"OpenRouter request failed.",
        code:data?.error?.code||"OPENROUTER_ERROR",
        model:MODEL
      },{status:res.status});
    }

    const content=data?.choices?.[0]?.message?.content;

    if(!content){
      return NextResponse.json({
        error:"OpenRouter returned an empty response.",
        model:MODEL
      },{status:502});
    }

    return NextResponse.json({
      content,
      model:MODEL,
      usage:data?.usage||null,
      requestId:res.headers.get("x-request-id")
    });
  }catch(e){
    return NextResponse.json({
      error:e instanceof Error?e.message:"Unexpected server error."
    },{status:500});
  }
}
