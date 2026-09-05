import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { validateFrameQualityBaseline } from "../src/frame-quality-baseline.mjs";
import { buildFrameQualityAudit, frameQualityAuditMarkdown } from "../src/frame-quality-audit.mjs";

const ROOT = process.cwd();

function recordKey(setId, lang, patternId) {
  return `${setId}:${lang}:${patternId}`;
}

function classifyAudit(rawAudit) {
  const exact = new Set(rawAudit.duplicateGroups.exact.flatMap((group) => group.pattern_ids.map((id) => recordKey(group.set_id, group.lang, id))));
  const variants = new Set(rawAudit.duplicateGroups.slotVariants.flatMap((group) => group.pattern_ids.map((id) => recordKey(group.set_id, group.lang, id))));
  const near = new Set(rawAudit.duplicateGroups.nearPairs.flatMap((group) => group.pattern_ids.map((id) => recordKey(group.set_id, group.lang, id))));
  const counts = {
    exact_duplicate_candidate: 0,
    contextual_variant_candidate: 0,
    uncertain_near_duplicate: 0,
    distinct_frame_candidate: 0,
  };
  const records = rawAudit.records.map((record) => {
    const key = recordKey(record.set_id, record.lang, record.pattern_id);
    const classification = exact.has(key)
      ? "exact_duplicate_candidate"
      : variants.has(key)
        ? "contextual_variant_candidate"
        : near.has(key)
          ? "uncertain_near_duplicate"
          : "distinct_frame_candidate";
    counts[classification] += 1;
    return { ...record, classification, human_reviewed: false };
  });
  return {
    ...rawAudit,
    summary: { ...rawAudit.summary, frame_classifications: counts },
    records,
  };
}

export function main() {
  const audit = classifyAudit(buildFrameQualityAudit(loadContent()));
  const snapshot = validateFrameQualityBaseline(audit);
  const directory = path.join(ROOT, "dist", "data", "quality");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "frame-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(
    path.join(directory, "frame-audit.md"),
    `${frameQualityAuditMarkdown(audit)}\n## Regression baseline\n\n- Duplicate/variant-affected Patterns: **${(snapshot.global.duplicateAffectedPatternRate * 100).toFixed(2)}%**\n- High-confidence audit issues: **${(snapshot.global.highConfidenceAuditIssuesPerPattern * 100).toFixed(2)} per 100 Patterns**\n- Guard: current global and established-set rates must not worsen without an explicit baseline review.\n`,
  );
  console.log(`Frame quality audit: ${audit.coverage.pattern_count} patterns / ${audit.coverage.study_set_count} sets; ${audit.summary.slot_variant_group_count} slot groups; ${audit.summary.near_duplicate_pair_count} near pairs; ${audit.summary.linguistic_issue_count} QA findings.`);
  console.log(`Frame quality baseline passed: ${(snapshot.global.duplicateAffectedPatternRate * 100).toFixed(2)}% duplicate/variant-affected; ${(snapshot.global.highConfidenceAuditIssuesPerPattern * 100).toFixed(2)} high-confidence audit issues per 100 patterns.`);
  return audit;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
