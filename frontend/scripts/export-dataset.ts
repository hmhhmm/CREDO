// Regenerates src/mobile/data/exports/dataset.json from the live generator
// (src/mobile/data/generateDataset.ts) — run via `npm run export:dataset`.
// generateDataset.ts is seeded/deterministic, so this file's content is stable across
// runs unless the generator itself changes.
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { universities, allEmployers, allCandidates, allJobs } from "../src/mobile/data/generateDataset";

const outPath = fileURLToPath(new URL("../src/mobile/data/exports/dataset.json", import.meta.url));

const dataset = {
  generatedAt: new Date().toISOString(),
  universities,
  employers: allEmployers,
  candidates: allCandidates,
  jobs: allJobs,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(dataset, null, 2));

console.log(
  `Wrote ${universities.length} universities, ${allEmployers.length} employers, ${allCandidates.length} candidates, ${allJobs.length} jobs -> ${outPath}`
);
