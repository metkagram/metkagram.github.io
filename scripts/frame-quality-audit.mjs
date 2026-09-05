import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { buildFrameQualityAudit, frameQualityAuditMarkdown } from "../src/frame-quality-audit.mjs";

const ROOT = process.cwd();

export function main() {
  const audit = buildFrameQualityAudit(loadContent());
  const directory = path.join(ROOT, "dist", "data", "quality");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "frame-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, "frame-audit.md"), frameQualityAuditMarkdown(audit));
  console.log(`Frame quality audit: ${audit.coverage.pattern_count} patterns / ${audit.coverage.study_set_count} sets; ${audit.summary.slot_variant_group_count} slot groups; ${audit.summary.near_duplicate_pair_count} near pairs; ${audit.summary.linguistic_issue_count} QA findings.`);
  return audit;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
