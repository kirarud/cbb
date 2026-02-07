import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve("tools/lead-inbox/data");
const statePath = path.join(dataDir, "state.json");

export async function loadState() {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      offset: Number(parsed.offset ?? 0),
      autoReplySent: Array.isArray(parsed.autoReplySent) ? new Set(parsed.autoReplySent) : new Set(),
    };
  } catch {
    return { offset: 0, autoReplySent: new Set() };
  }
}

export async function saveState(state) {
  await mkdir(dataDir, { recursive: true });
  const serializable = {
    offset: state.offset ?? 0,
    autoReplySent: Array.from(state.autoReplySent ?? []),
  };
  await writeFile(statePath, JSON.stringify(serializable, null, 2) + "\n", "utf8");
}

