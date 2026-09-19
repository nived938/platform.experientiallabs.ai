import {NextResponse} from "next/server";

export async function GET(){
  const model=process.env.OPENROUTER_MODEL||"z-ai/glm-5.2:free";

  return NextResponse.json({
    models:[model],
    defaultModel:model
  });
}
