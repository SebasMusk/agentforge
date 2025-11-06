export type AgentProfile = Record<string, unknown>;

export interface GeneratedPrompt {
  system: string;
  user: string;
  context: Record<string, unknown>;
  messages: { role: "system" | "user"; content: string }[];
  text: string; // Prompt concatenado (útil para modelos que esperan un solo string)
}

function buildSystemRole(): string {
  return (
    "Eres un asistente experto y pragmático. " +
    "Responde de forma breve, precisa y accionable. " +
    "Usa el contexto del usuario para personalizar la respuesta y evita suposiciones infundadas."
  );
}

function normalizeProfile(profile: AgentProfile): Record<string, unknown> {
  if (!profile || typeof profile !== "object") return {};
  const sortedKeys = Object.keys(profile).sort((a, b) => a.localeCompare(b));
  const cleaned: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const value = (profile as Record<string, unknown>)[key];
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned;
}

export function generatePrompt(
  agentProfile: AgentProfile,
  intent: string
): GeneratedPrompt {
  const system = buildSystemRole();
  const context = normalizeProfile(agentProfile);
  const user = `Intent: ${intent?.trim() || ""}`.trim();

  const contextBlock = JSON.stringify(context, null, 2);
  const userWithContext = `${user}\n\nContexto del usuario (JSON):\n${contextBlock}`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: userWithContext },
  ];

  const text = `SYSTEM:\n${system}\n\nUSER:\n${userWithContext}`;

  return { system, user, context, messages, text };
}

/**
 * Ejemplo de uso:
 *
 * const profile = {
 *   nombre: "Sebastián",
 *   idiomaPreferido: "es",
 *   objetivos: ["aprender Next.js", "optimizar prompts"],
 *   restricciones: { tiempo: "limitado" },
 * };
 *
 * const { messages } = generatePrompt(profile, "Crear un plan de estudio de 2 semanas");
 * // Luego puedes usar `messages` con OpenAI:
 * // openai.chat.completions.create({ model: "gpt-4o-mini", messages })
 */


