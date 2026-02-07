import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeClipboardText } from "./lib/clipboard.mjs";

const templatesPath = path.resolve("tools/lead-inbox/templates.json");
const templates = JSON.parse(await readFile(templatesPath, "utf8"));

const [cmd, id] = process.argv.slice(2);

if (cmd === "list") {
  for (const [key, val] of Object.entries(templates)) {
    // eslint-disable-next-line no-console
    console.log(`${key}\t${val.title ?? ""}`.trim());
  }
  process.exit(0);
}

if (cmd === "copy") {
  if (!id || !templates[id]) {
    // eslint-disable-next-line no-console
    console.error("Unknown template id. Run: node tools/lead-inbox/copy-template.mjs list");
    process.exit(1);
  }
  await writeClipboardText(String(templates[id].text ?? ""));
  // eslint-disable-next-line no-console
  console.log(`Copied: ${id}`);
  process.exit(0);
}

// eslint-disable-next-line no-console
console.error("Usage:\n  node tools/lead-inbox/copy-template.mjs list\n  node tools/lead-inbox/copy-template.mjs copy <id>");
process.exit(1);

