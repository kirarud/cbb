import { mkdir, readFile, stat, open } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve("tools/lead-inbox/data");
const inboxPath = path.join(dataDir, "inbox.jsonl");

export async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function appendInboxItem(item) {
  await ensureDataDir();
  const line = JSON.stringify(item) + "\n";
  const file = await open(inboxPath, "a");
  try {
    await file.write(line, null, "utf8");
  } finally {
    await file.close();
  }
}

export function newId(prefix = "lead") {
  const ts = new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replaceAll(".", "");
  const rand = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

export async function appendMessage(message) {
  const id = message.id ?? newId("lead");
  await appendInboxItem({
    event_type: "message",
    id,
    ...message,
  });
  return id;
}

export async function appendUpdate(update) {
  if (!update?.id) throw new Error("appendUpdate: missing id");
  await appendInboxItem({
    event_type: "update",
    ts: new Date().toISOString(),
    ...update,
  });
}

export async function readLastItems(limit) {
  await ensureDataDir();
  try {
    await stat(inboxPath);
  } catch {
    return [];
  }

  const buf = await readFile(inboxPath, "utf8");
  const lines = buf.trim().length ? buf.trim().split("\n") : [];
  const slice = lines.slice(Math.max(0, lines.length - limit));
  const items = [];
  for (const line of slice) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // ignore broken lines
    }
  }
  return items.reverse();
}

export async function readModel({ limit = 5000 } = {}) {
  const events = await readLastItems(limit);

  /** @type {Map<string, any>} */
  const byId = new Map();

  for (const ev of events.reverse()) {
    const eventType = ev.event_type ?? "message";

    if (eventType === "message") {
      const id = ev.id ?? newId("legacy");
      const existing = byId.get(id);
      if (existing) continue;
      byId.set(id, {
        id,
        ts: ev.ts ?? new Date().toISOString(),
        platform: ev.platform ?? "unknown",
        chat_id: ev.chat_id ?? null,
        username: ev.username ?? null,
        name: ev.name ?? null,
        text: ev.text ?? null,
        note: ev.note ?? null,
        status: "new",
        tags: [],
        message_id: ev.message_id ?? null,
      });
      continue;
    }

    if (eventType === "update") {
      const id = ev.id;
      if (!id) continue;
      const item = byId.get(id);
      if (!item) {
        byId.set(id, {
          id,
          ts: ev.ts ?? new Date().toISOString(),
          platform: ev.platform ?? "unknown",
          chat_id: ev.chat_id ?? null,
          username: ev.username ?? null,
          name: ev.name ?? null,
          text: ev.text ?? null,
          note: null,
          status: "new",
          tags: [],
          message_id: ev.message_id ?? null,
        });
      }
      const cur = byId.get(id);
      if (typeof ev.status === "string") cur.status = ev.status;
      if (typeof ev.note === "string") cur.note = ev.note;
      if (Array.isArray(ev.tags)) cur.tags = ev.tags;
      continue;
    }
  }

  const items = [...byId.values()].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));
  return { items };
}
