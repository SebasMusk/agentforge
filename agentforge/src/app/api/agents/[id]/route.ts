import { NextRequest, NextResponse } from "next/server";
import { deleteAgent, getAgentById, updateAgent } from "@/core/agentsStore";

function hasUpdatableFields(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    Object.prototype.hasOwnProperty.call(o, "name") ||
    Object.prototype.hasOwnProperty.call(o, "description") ||
    Object.prototype.hasOwnProperty.call(o, "profileJSON")
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "'id' es requerido" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (!hasUpdatableFields(body)) {
      return NextResponse.json(
        { ok: false, error: "Debe incluir al menos un campo actualizable" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {};
    if (typeof body.name === "string") payload.name = body.name.trim();
    if (typeof body.description === "string") payload.description = body.description;
    if (Object.prototype.hasOwnProperty.call(body, "profileJSON")) {
      payload.profileJSON = body.profileJSON;
    }

    const exists = await getAgentById(id);
    if (!exists) {
      return NextResponse.json(
        { ok: false, error: "Agente no encontrado" },
        { status: 404 }
      );
    }

    const updated = await updateAgent(id, payload);
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error("[PUT /api/agents/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error actualizando agente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "'id' es requerido" },
        { status: 400 }
      );
    }

    const ok = await deleteAgent(id);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Agente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/agents/:id]", error);
    return NextResponse.json(
      { ok: false, error: "Error eliminando agente" },
      { status: 500 }
    );
  }
}


