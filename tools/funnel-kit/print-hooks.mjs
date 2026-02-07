import { readFile } from "node:fs/promises";
import path from "node:path";

const hooksPath = path.resolve("tools/funnel-kit/scripts.json");
const data = JSON.parse(await readFile(hooksPath, "utf8"));

const max = Number(process.env.MAX ?? "50");
const items = (data.items ?? []).slice(0, max);

for (const it of items) {
  // eslint-disable-next-line no-console
  console.log(`\n# ${it.id} — ${it.title}\n`);
  // eslint-disable-next-line no-console
  console.log(it.script.trim());
  if (it.caption) {
    // eslint-disable-next-line no-console
    console.log("\nCaption:");
    // eslint-disable-next-line no-console
    console.log(it.caption.trim());
  }
}

