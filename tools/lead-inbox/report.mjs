import { readLastItems } from "./lib/store.mjs";

const items = await readLastItems(10000);
const sinceHours = Number(process.env.SINCE_HOURS ?? "24");
const sinceTs = Date.now() - sinceHours * 60 * 60 * 1000;

const recent = items.filter((i) => Date.parse(i.ts ?? 0) >= sinceTs);
const byPlatform = new Map();
for (const i of recent) {
  const key = i.platform ?? "unknown";
  byPlatform.set(key, (byPlatform.get(key) ?? 0) + 1);
}

// eslint-disable-next-line no-console
console.log(`Leads last ${sinceHours}h: ${recent.length}`);
for (const [k, v] of [...byPlatform.entries()].sort((a, b) => b[1] - a[1])) {
  // eslint-disable-next-line no-console
  console.log(`- ${k}: ${v}`);
}

