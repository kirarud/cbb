import { mkdir, open, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { candidatesDir, dataDir, vacanciesPath } from "./paths.mjs";

export async function ensureJobDigestDirs() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(candidatesDir, { recursive: true });
}

export function newId(prefix = "vac") {
  const ts = new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replaceAll(".", "");
  const rand = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

export async function appendVacancy(vacancy) {
  await ensureJobDigestDirs();
  const line = JSON.stringify(vacancy) + "\n";
  const file = await open(vacanciesPath, "a");
  try {
    await file.write(line, null, "utf8");
  } finally {
    await file.close();
  }
}

export async function readVacancies({ limit = 5000 } = {}) {
  await ensureJobDigestDirs();
  try {
    await stat(vacanciesPath);
  } catch {
    return [];
  }
  const buf = await readFile(vacanciesPath, "utf8");
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

export async function readCandidate(candidateId) {
  await ensureJobDigestDirs();
  const p = path.join(candidatesDir, `${candidateId}.json`);
  const raw = await readFile(p, "utf8");
  const c = JSON.parse(raw);
  if (!c?.id) c.id = candidateId;
  return c;
}

export async function saveCandidate(candidate) {
  await ensureJobDigestDirs();
  if (!candidate?.id) throw new Error("saveCandidate: missing id");
  const p = path.join(candidatesDir, `${candidate.id}.json`);
  await writeFile(p, JSON.stringify(candidate, null, 2) + "\n", "utf8");
}

export async function listCandidates() {
  await ensureJobDigestDirs();
  const entries = await readdir(candidatesDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name);
  const items = [];
  for (const file of files) {
    try {
      const raw = await readFile(path.join(candidatesDir, file), "utf8");
      const data = JSON.parse(raw);
      if (data && data.id) items.push(data);
    } catch {
      // ignore broken files
    }
  }
  return items;
}
