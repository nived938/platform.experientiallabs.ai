import {NextResponse} from "next/server";

export async function GET(){
  const key=process.env.EXPLABS_API_KEY;
  if(!key)return NextResponse.json({error:"EXPLABS_API_KEY is not configured."},{status:500});
  const res=await fetch("https://api.experientiallabs.ai/v1/models",{headers:{Authorization:"Bearer "+key},cache:"no-store"});
  const data=await res.json();
  if(!res.ok)return NextResponse.json({error:data?.error?.message||"Unable to load models."},{status:res.status});
  const models=(data.data||[]).map(x=>x.id).filter(Boolean);
  return NextResponse.json({models,defaultModel:process.env.EXPLABS_MODEL||models[0]||""});
}
