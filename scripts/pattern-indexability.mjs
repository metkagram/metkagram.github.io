import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { loadFrameFamilies } from "../src/frame-families.mjs";
import { buildPatternIndexability } from "../src/pattern-indexability.mjs";

const ROOT = process.cwd();

export function main() {
  const report = buildPatternIndexability(loadContent(), { frameFamilies: loadFrameFamilies() });
  const target = path.join(ROOT, "dist", "data", "quality", "pattern-indexability.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Pattern indexability: ${report.counts.indexable}/${report.counts.total} indexable; ${report.counts.noindex} noindex.`);
  console.log(`Pattern indexability reasons: ${JSON.stringify(report.counts.byReason)}`);
  console.log(`Pattern noindex editorial statuses: ${JSON.stringify(report.counts.noindexByEditorialStatus)}`);
  console.log(`Pattern noindex by set: ${JSON.stringify(report.counts.noindexBySet)}`);
  return report;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) main();
