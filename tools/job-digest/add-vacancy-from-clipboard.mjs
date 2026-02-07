import { appendVacancy, newId } from "./lib/store.mjs";
import { readClipboardText } from "./lib/clipboard.mjs";

const args = process.argv.slice(2);
const source = readArg(args, "--source") ?? "manual";
const url = readArg(args, "--url") ?? null;
const title = readArg(args, "--title") ?? null;

const text = (await readClipboardText()).trim();
if (!text && !url) {
  // eslint-disable-next-line no-console
  console.error("Clipboard is empty (and no --url provided).");
  process.exit(1);
}

const vacancy = {
  id: newId("vac"),
  ts: new Date().toISOString(),
  source,
  url,
  title,
  text,
};

await appendVacancy(vacancy);

// eslint-disable-next-line no-console
console.log(`Saved vacancy: ${vacancy.id}`);

function readArg(argv, key) {
  const idx = argv.indexOf(key);
  if (idx === -1) return null;
  const v = argv[idx + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

