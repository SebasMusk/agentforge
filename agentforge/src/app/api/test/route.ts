import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET() {
  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: "Hola, AgentForge test" }],
      max_tokens: 200
    });
    return NextResponse.json({ message: res.choices[0].message.content });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
