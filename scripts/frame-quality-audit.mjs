import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { buildFrameQualityAudit, frameQualityAuditMarkdown } from "../src/frame-quality-audit.mjs";

const ROOT = process.cwd();

function baselineCandidate(audit) {
  const duplicateIds = new Set([
    ...audit.duplicateGroups.exact,
    ...audit.duplicateGroups.slotVariants,
    ...audit.duplicateGroups.nearPairs,
  ].flatMap((item) => item.pattern_ids));
  const highConfidenceIssues = audit.linguisticIssues.filter((item) => item.confidence === "high").length;
  const round = (value) => Number(value.toFixed(6));
  return {
    schemaVersion: 1,
    patternCount: audit.coverage.pattern_count,
    studySetCount: audit.coverage.study_set_count,
    duplicateAffectedPatternRate: round(duplicateIds.size / audit.coverage.pattern_count),
    highConfidenceLinguisticIssuesPerPattern: round(highConfidenceIssues / audit.coverage.pattern_count),
    sets: Object.fromEntries(Object.entries(audit.setMetrics).sort(([a], [b]) => a.localeCompare(b)).map(([id, metrics]) => [id, {
      duplicateAffectedRate: metrics.duplicate_affected_rate,
      highConfidenceLinguisticIssuesPerPattern: round(metrics.high_confidence_linguistic_issue_count / Math.max(1, metrics.pattern_count)),
    }])),
  };
}

export function main() {
  const audit = buildFrameQualityAudit(loadContent());
  const directory = path.join(ROOT, "dist", "data", "quality");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "frame-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(path.join(directory, "frame-audit.md"), frameQualityAuditMarkdown(audit));
  console.log(`Frame quality audit: ${audit.coverage.pattern_count} patterns / ${audit.coverage.study_set_count} sets; ${audit.summary.slot_variant_group_count} slot groups; ${audit.summary.near_duplicate_pair_count} near pairs; ${audit.summary.linguistic_issue_count} QA findings.`);
  console.log(`FRAME_AUDIT_BASELINE_CANDIDATE=${JSON.stringify(baselineCandidate(audit))}`);
  return audit;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
