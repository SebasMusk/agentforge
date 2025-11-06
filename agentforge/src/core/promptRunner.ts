import { generatePrompt, AgentProfile } from "./promptGenerator";
import { callOpenAI } from "./openaiService";
import { estimateCost, recordUsage } from "./tokenMonitor";

export interface RunAgentPromptArgs {
  agentProfile: AgentProfile;
  intent: string;
  model: string;
  max_tokens?: number;
  userId: string;
}

export interface RunAgentPromptResult {
  text: string;
  tokens_input: number;
  tokens_output: number;
  raw: unknown;
  messages: { role: "system" | "user"; content: string }[];
  prompt_text: string;
}

export async function runAgentPrompt(
  args: RunAgentPromptArgs
): Promise<RunAgentPromptResult> {
  const { agentProfile, intent, model, max_tokens, userId } = args;
  const prompt = generatePrompt(agentProfile, intent);

  const result = await callOpenAI({
    model,
    max_tokens,
    messages: prompt.messages,
  });

  // Registrar uso de tokens y coste estimado (no bloqueante en caso de error)
  try {
    const cost = estimateCost(result.tokens_input, result.tokens_output);
    await recordUsage({
      userId,
      tokensInput: result.tokens_input,
      tokensOutput: result.tokens_output,
      cost,
    });
  } catch (err) {
    // Solo logging; no interrumpimos la respuesta principal
    console.warn("[tokenMonitor] fallo registrando uso:", err);
  }

  return {
    text: result.text,
    tokens_input: result.tokens_input,
    tokens_output: result.tokens_output,
    raw: result.raw,
    messages: prompt.messages,
    prompt_text: prompt.text,
  };
}

export default runAgentPrompt;


