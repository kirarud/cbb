export function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .replaceAll("ё", "е")
    .replaceAll(/[^\p{L}\p{N}\s]+/gu, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function containsAny(text, needles) {
  const t = norm(text);
  for (const n of needles ?? []) {
    if (!n) continue;
    if (t.includes(norm(n))) return true;
  }
  return false;
}

export function scoreVacancy(candidate, vacancy) {
  const text = [vacancy.title, vacancy.text, vacancy.url].filter(Boolean).join("\n");
  const t = norm(text);

  let score = 0;
  const hits = [];
  const misses = [];

  const roleTargets = (candidate.role_targets ?? []).map(norm).filter(Boolean);
  const positive = (candidate.keywords_positive ?? []).map(norm).filter(Boolean);
  const negative = (candidate.keywords_negative ?? []).map(norm).filter(Boolean);
  const city = norm(candidate.city ?? "");

  if (city && t.includes(city)) {
    score += 2;
    hits.push(`город:${candidate.city}`);
  }

  for (const r of roleTargets) {
    if (r && t.includes(r)) {
      score += 6;
      hits.push(`роль:${r}`);
    }
  }

  for (const k of positive) {
    if (k && t.includes(k)) {
      score += 2;
      hits.push(k);
    }
  }

  for (const bad of negative) {
    if (bad && t.includes(bad)) {
      score -= 6;
      misses.push(`- ${bad}`);
    }
  }

  // heuristics
  if (t.includes("удален")) score += 2;
  if (t.includes("гибрид")) score += 1;
  if (t.includes("стажиров")) score += 1;
  if (t.includes("обучен")) score += 1;
  if (t.includes("испытательн")) score += 0; // neutral

  return { score, hits, misses };
}

export function truncate(s, max = 260) {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}

