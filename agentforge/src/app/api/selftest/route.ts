import { NextResponse } from "next/server";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  listAgents,
  updateAgent,
} from "@/core/agentsStore";
import { generatePrompt } from "@/core/promptGenerator";
import { runAgentPrompt } from "@/core/promptRunner";
import { estimateCost, getUsageByUser, recordUsage } from "@/core/tokenMonitor";

export async function GET() {
  const results: Record<string, unknown> = {};
  const cleanupIds: string[] = [];

  try {
    // 1) agentsStore CRUD
    const created = await createAgent({
      name: "selftest-agent",
      description: "agent de prueba",
      profileJSON: { gustos: ["tech", "coffee"], nivel: "avanzado" },
    });
    cleanupIds.push(created.id);

    const listed = await listAgents();
    const fetched = await getAgentById(created.id);
    const updated = await updateAgent(created.id, { description: "actualizado" });

    results.agents = {
      created,
      listedCount: listed.length,
      fetchedOk: Boolean(fetched && fetched.id === created.id),
      updatedDescription: updated?.description,
    };

    // 2) promptGenerator
    const profile = { nombre: "Test", preferencias: { idioma: "es" } };
    const intent = "Genera un saludo corto";
    const prompt = generatePrompt(profile, intent);
    results.prompt = {
      systemLen: prompt.system.length,
      userStartsWith: prompt.user.slice(0, 10),
      messagesCount: prompt.messages.length,
    };

    // 3) promptRunner (solo si hay API key)
    if (process.env.OPENAI_API_KEY) {
      try {
        const run = await runAgentPrompt({
          agentProfile: profile,
          intent,
          model: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini",
          max_tokens: 64,
          userId: "selftest-user",
        });
        results.openai = {
          ok: true,
          textPreview: run.text.slice(0, 80),
          tokensIn: run.tokens_input,
          tokensOut: run.tokens_output,
        };
      } catch (e) {
        results.openai = { ok: false, error: e instanceof Error ? e.message : "Unknown" };
      }
    } else {
      results.openai = { ok: false, skipped: true, reason: "OPENAI_API_KEY no definida" };
    }

    // 4) tokenMonitor
    const estimated = estimateCost(1234, 567);
    const rec = await recordUsage({ userId: "selftest-user", tokensInput: 1234, tokensOutput: 567, cost: estimated });
    const history = await getUsageByUser("selftest-user");
    results.tokens = {
      estimated,
      lastRecordTs: rec.timestamp,
      historyCount: history.length,
    };

    // Limpieza básica: eliminar el agente creado
    await deleteAgent(created.id);

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    // Intento de limpieza en caso de fallo
    for (const id of cleanupIds) {
      try {
        await deleteAgent(id);
      } catch {
        // ignore
      }
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}


