import {NextResponse} from "next/server";

export async function POST(req){
  const key=process.env.EXPLABS_API_KEY;
  if(!key)return NextResponse.json({error:"EXPLABS_API_KEY is not configured on the server."},{status:500});
  try{
    const {messages,model}=await req.json();
    if(!Array.isArray(messages)||!messages.length)return NextResponse.json({error:"Messages are required."},{status:400});
    const clean=messages.map(m=>({role:m.role,content:String(m.content)}));
    const res=await fetch("https://api.experientiallabs.ai/v1/chat/completions",{
      method:"POST",
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:model||process.env.EXPLABS_MODEL||"gpt-5.6-terra",
        messages:clean,
        stream:false
      })
    });
    const data=await res.json();
    if(!res.ok)return NextResponse.json({error:data?.error?.message||"Experiential Labs request failed."},{status:res.status});
    return NextResponse.json({
      content:data?.choices?.[0]?.message?.content||"",
      usage:data?.usage||null,
      requestId:res.headers.get("x-request-id")
    });
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Unexpected server error."},{status:500});
  }
}
