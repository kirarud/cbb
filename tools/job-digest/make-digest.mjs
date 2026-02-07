import { readCandidate, readVacancies } from "./lib/store.mjs";
import { buildDigest } from "./lib/digest.mjs";

const args = process.argv.slice(2);
const candidateId = readArg(args, "--candidate") ?? readArg(args, "-c");
const count = Number(readArg(args, "--count") ?? "10");
const limit = Number(readArg(args, "--limit") ?? "2000");

if (!candidateId) {
  // eslint-disable-next-line no-console
  console.error("Usage: node tools/job-digest/make-digest.mjs --candidate <id> [--count 10]");
  process.exit(1);
}

const candidate = await readCandidate(candidateId);
const vacancies = await readVacancies({ limit });

const digest = buildDigest(candidate, vacancies, { count });

// eslint-disable-next-line no-console
console.log(digest);

function readArg(argv, key) {
  const idx = argv.indexOf(key);
  if (idx === -1) return null;
  const v = argv[idx + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}
