import { promises as fs } from "fs";
import path from "path";
import { CostRates, RecordUsageArgs, TokenUsageRecord } from "../types/token";

const DEFAULT_RATES: CostRates = {
  inputPerThousand: 0.005,
  outputPerThousand: 0.015,
};

function getDataFilePath(): string {
  const root = process.cwd();
  return path.join(root, "data", "token-usage.json");
}

async function ensureDataFile(): Promise<void> {
  const filePath = getDataFilePath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readAllRecords(): Promise<TokenUsageRecord[]> {
  await ensureDataFile();
  const filePath = getDataFilePath();
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TokenUsageRecord[]) : [];
  } catch {
    // Si el JSON está corrupto, re-inicializamos a lista vacía
    return [];
  }
}

async function writeAllRecords(records: TokenUsageRecord[]): Promise<void> {
  const filePath = getDataFilePath();
  const content = JSON.stringify(records, null, 2);
  await fs.writeFile(filePath, content, "utf8");
}

export function estimateCost(
  tokensInput: number,
  tokensOutput: number,
  rates: CostRates = DEFAULT_RATES
): number {
  const inputCost = (tokensInput / 1000) * rates.inputPerThousand;
  const outputCost = (tokensOutput / 1000) * rates.outputPerThousand;
  return Number((inputCost + outputCost).toFixed(6));
}

export async function recordUsage(args: RecordUsageArgs): Promise<TokenUsageRecord> {
  const { userId, tokensInput, tokensOutput } = args;
  const cost =
    typeof args.cost === "number"
      ? args.cost
      : estimateCost(tokensInput, tokensOutput);

  const record: TokenUsageRecord = {
    userId,
    tokensInput,
    tokensOutput,
    cost,
    timestamp: new Date().toISOString(),
  };

  const all = await readAllRecords();
  all.push(record);
  await writeAllRecords(all);
  return record;
}

export async function getUsageByUser(userId: string): Promise<TokenUsageRecord[]> {
  const all = await readAllRecords();
  return all.filter((r) => r.userId === userId);
}

const tokenMonitor = {
  recordUsage,
  getUsageByUser,
  estimateCost,
};

export default tokenMonitor;


