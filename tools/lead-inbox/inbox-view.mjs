import http from "node:http";
import { appendMessage, appendUpdate, readModel } from "./lib/store.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendVacancy,
  listCandidates,
  readCandidate,
  readVacancies,
  saveCandidate,
  newId as newVacancyId,
} from "../job-digest/lib/store.mjs";
import { buildDigest } from "../job-digest/lib/digest.mjs";

const host = "127.0.0.1";
const port = Number(process.env.PORT ?? "8787");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesPath = path.resolve(__dirname, "templates.json");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${host}:${port}`);

  if (url.pathname === "/api/items") {
    const limit = Math.max(1, Math.min(20000, Number(url.searchParams.get("limit") ?? "5000")));
    const { items } = await readModel({ limit });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ items }));
    return;
  }

  if (url.pathname === "/api/templates") {
    const raw = await readFile(templatesPath, "utf8");
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(raw);
    return;
  }

  if (url.pathname === "/api/message" && req.method === "POST") {
    const body = await readJson(req);
    const id = await appendMessage({
      ts: new Date().toISOString(),
      platform: String(body.platform ?? "unknown"),
      name: body.name ? String(body.name) : null,
      username: body.username ? String(body.username) : null,
      text: body.text ? String(body.text) : "",
      note: body.note ? String(body.note) : null,
    });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, id }));
    return;
  }

  if (url.pathname === "/api/update" && req.method === "POST") {
    const body = await readJson(req);
    await appendUpdate({
      id: String(body.id ?? ""),
      status: body.status ? String(body.status) : undefined,
      note: body.note != null ? String(body.note) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/api/candidates") {
    const items = await listCandidates();
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ items }));
    return;
  }

  if (url.pathname === "/api/candidate" && req.method === "POST") {
    const body = await readJson(req);
    const id = cleanId(body.id);
    if (!id) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "missing id" }));
      return;
    }

    const candidate = {
      id,
      name: str(body.name),
      city: str(body.city),
      role_targets: list(body.role_targets),
      schedule: list(body.schedule),
      salary_min_rub: num(body.salary_min_rub),
      keywords_positive: list(body.keywords_positive),
      keywords_negative: list(body.keywords_negative),
      notes: str(body.notes),
    };

    await saveCandidate(candidate);
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, id }));
    return;
  }

  if (url.pathname === "/api/vacancy" && req.method === "POST") {
    const body = await readJson(req);
    const vacancy = {
      id: newVacancyId("vac"),
      ts: new Date().toISOString(),
      source: str(body.source) || "manual",
      url: str(body.url) || null,
      title: str(body.title) || null,
      text: str(body.text) || "",
    };
    await appendVacancy(vacancy);
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, id: vacancy.id }));
    return;
  }

  if (url.pathname === "/api/digest" && req.method === "POST") {
    const body = await readJson(req);
    const candidateId = cleanId(body.candidate_id);
    const count = Math.max(1, Math.min(30, Number(body.count ?? 10)));
    if (!candidateId) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "missing candidate_id" }));
      return;
    }
    const candidate = await readCandidate(candidateId);
    const vacancies = await readVacancies({ limit: 3000 });
    const digest = buildDigest(candidate, vacancies, { count });
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, text: digest }));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = await readTextFile(new URL("./web/index.html", import.meta.url));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Lead Inbox: http://${host}:${port}/`);
});
server.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error(String(err?.stack ?? err));
  // eslint-disable-next-line no-console
  console.error(
    "If you see EPERM, your environment may block binding to local ports. Try running outside the sandbox or use CLI tools (report.mjs + capture-clipboard.mjs).",
  );
  process.exit(1);
});

async function readTextFile(url) {
  return readFile(url, "utf8");
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function str(value) {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function list(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function cleanId(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]+/gu, "");
  return raw.slice(0, 40);
}
