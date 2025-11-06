import { NextRequest, NextResponse } from "next/server";
import { createAgent, listAgents } from "@/core/agentsStore";

function isPlainObject(value: unknown): boolean {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ ok: true, data: agents });
  } catch (error) {
    console.error("[GET /api/agents]", error);
    return NextResponse.json(
      { ok: false, error: "Error leyendo agentes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description : undefined;
    const profileJSON = body?.profileJSON;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "'name' es requerido y debe ser string" },
        { status: 400 }
      );
    }

    if (
      profileJSON !== undefined &&
      !(isPlainObject(profileJSON) || Array.isArray(profileJSON) || typeof profileJSON === "string" || typeof profileJSON === "number" || typeof profileJSON === "boolean" || profileJSON === null)
    ) {
      return NextResponse.json(
        { ok: false, error: "'profileJSON' debe ser JSON válido" },
        { status: 400 }
      );
    }

    const created = await createAgent({ name, description, profileJSON });
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/agents]", error);
    return NextResponse.json(
      { ok: false, error: "Error creando agente" },
      { status: 500 }
    );
  }
}


