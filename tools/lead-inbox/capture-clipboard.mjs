import { appendMessage } from "./lib/store.mjs";
import { readClipboardText } from "./lib/clipboard.mjs";

const args = process.argv.slice(2);
const source = readArg(args, "--source") ?? "unknown";
const note = readArg(args, "--note") ?? null;

const text = (await readClipboardText()).trim();
if (!text) {
  // eslint-disable-next-line no-console
  console.error("Clipboard is empty.");
  process.exit(1);
}

await appendMessage({
  ts: new Date().toISOString(),
  platform: source,
  text,
  note,
});

// eslint-disable-next-line no-console
console.log("Captured to inbox.");

function readArg(argv, key) {
  const idx = argv.indexOf(key);
  if (idx === -1) return null;
  const v = argv[idx + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}
