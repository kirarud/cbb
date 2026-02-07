import { scoreVacancy, truncate } from "./text.mjs";

export function buildDigest(candidate, vacancies, { count = 10 } = {}) {
  const ranked = (vacancies ?? [])
    .map((v) => {
      const s = scoreVacancy(candidate, v);
      return { v, ...s };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(50, count)));

  const lines = [];
  lines.push(`Подборка вакансий для: ${candidate?.name ?? candidate?.id ?? "кандидат"}`);
  lines.push(`Цель: ${(candidate?.role_targets ?? []).join(", ") || "—"}`);
  lines.push("");

  let n = 0;
  for (const r of ranked) {
    n += 1;
    const title = r.v.title || firstLine(r.v.text) || "Вакансия";
    const url = r.v.url ? `\n${r.v.url}` : "";
    const why = r.hits?.length ? `\nПочему: ${truncate(r.hits.slice(0, 4).join(", "), 160)}` : "";
    const warn = r.misses?.length ? `\n⚠️ ${truncate(r.misses.slice(0, 2).join("; "), 160)}` : "";
    lines.push(`${n}) ${truncate(title, 140)}${url}${why}${warn}`.trim());
    lines.push("");
    if (n >= count) break;
  }

  return lines.join("\n").trim();
}

function firstLine(s) {
  const t = String(s ?? "").trim();
  if (!t) return "";
  const idx = t.indexOf("\n");
  return idx === -1 ? t : t.slice(0, idx);
}
