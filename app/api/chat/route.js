import {NextResponse} from "next/server";

export async function POST(req){
  const key=process.env.OPENROUTER_API_KEY;
  if(!key)return NextResponse.json({error:"OPENROUTER_API_KEY is not configured on the server."},{status:500});

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
        model:"z-ai/glm-5.2:free",
        messages:clean,
        stream:false
      })
    });

    const data=await res.json();

    if(!res.ok){
      return NextResponse.json({
        error:data?.error?.message||"OpenRouter request failed."
      },{status:res.status});
    }

    return NextResponse.json({
      content:data?.choices?.[0]?.message?.content||"",
      usage:data?.usage||null,
      requestId:res.headers.get("x-request-id")
    });
  }catch(e){
    return NextResponse.json({
      error:e instanceof Error?e.message:"Unexpected server error."
    },{status:500});
  }
}
