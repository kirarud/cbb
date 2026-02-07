import path from "node:path";

export const dataDir = path.resolve("tools/job-digest/data");
export const candidatesDir = path.join(dataDir, "candidates");
export const vacanciesPath = path.join(dataDir, "vacancies.jsonl");

