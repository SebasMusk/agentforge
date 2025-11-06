import { promises as fs } from "fs";
import path from "path";

export interface Agent {
  id: string;
  name: string;
  description?: string;
  profileJSON?: unknown;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

function getDataFilePath(): string {
  const root = process.cwd();
  return path.join(root, "data", "agents.json");
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

async function readAll(): Promise<Agent[]> {
  await ensureDataFile();
  const raw = await fs.readFile(getDataFilePath(), "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Agent[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Agent[]): Promise<void> {
  await fs.writeFile(getDataFilePath(), JSON.stringify(items, null, 2), "utf8");
}

export async function listAgents(): Promise<Agent[]> {
  return readAll();
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  const items = await readAll();
  return items.find((a) => a.id === id);
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  profileJSON?: unknown;
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  const now = new Date().toISOString();
  const items = await readAll();
  const id = crypto.randomUUID();

  const agent: Agent = {
    id,
    name: input.name,
    description: input.description,
    profileJSON: input.profileJSON,
    createdAt: now,
    updatedAt: now,
  };

  items.push(agent);
  await writeAll(items);
  return agent;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  profileJSON?: unknown;
}

export async function updateAgent(
  id: string,
  input: UpdateAgentInput
): Promise<Agent | undefined> {
  const items = await readAll();
  const index = items.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  const current = items[index];
  const updated: Agent = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updated;
  await writeAll(items);
  return updated;
}

export async function deleteAgent(id: string): Promise<boolean> {
  const items = await readAll();
  const filtered = items.filter((a) => a.id !== id);
  if (filtered.length === items.length) return false;
  await writeAll(filtered);
  return true;
}

const agentsStore = {
  listAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
};

export default agentsStore;


