import OpenAI from "openai";

type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CallOpenAIArgs {
  messages: ChatMessage[];
  model: string;
  max_tokens?: number;
}

export interface CallOpenAIResult<TRaw = unknown> {
  text: string;
  tokens_input: number;
  tokens_output: number;
  raw: TRaw;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callOpenAI(
  args: CallOpenAIArgs
): Promise<CallOpenAIResult> {
  const { messages, model, max_tokens } = args;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está definido en el entorno");
  }

  const maxAttempts = 3;
  let lastError: unknown = undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[openai] intento ${attempt}/${maxAttempts} → modelo=${model}, mensajes=${messages.length}`
      );

      const completion = await openai.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens,
      });

      const choice = completion.choices?.[0];
      const text =
        (choice?.message?.content ?? "").toString();

      const tokens_input = completion.usage?.prompt_tokens ?? 0;
      const tokens_output = completion.usage?.completion_tokens ?? 0;

      const result: CallOpenAIResult = {
        text,
        tokens_input,
        tokens_output,
        raw: completion,
      };

      console.log(
        `[openai] OK (${tokens_input} in, ${tokens_output} out, total=${completion.usage?.total_tokens ?? 0})`
      );

      return result;
    } catch (error) {
      lastError = error;
      console.log(`[openai] error en intento ${attempt}:`, error);

      if (attempt < maxAttempts) {
        const backoffMs = 500 * Math.pow(2, attempt - 1); // 500ms, 1000ms, 2000ms
        console.log(`[openai] reintentando en ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Error desconocido al llamar a OpenAI");
}

export default callOpenAI;


