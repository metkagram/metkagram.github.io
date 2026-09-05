import fs from "node:fs";
import path from "node:path";

import { loadStudySetPreservationManifest } from "./study-set-preservation.mjs";

export const FRAME_QUALITY_BASELINE_FILE = path.join("data", "quality", "frame-audit-baseline.json");

const EPSILON = 1e-6;

function invariant(condition, message) {
  if (!condition) throw new Error(`Frame quality regression: ${message}`);
}

function round(value) {
  return Number(value.toFixed(6));
}

export function loadFrameQualityBaseline(root = process.cwd()) {
  const file = path.join(root, FRAME_QUALITY_BASELINE_FILE);
  invariant(fs.existsSync(file), `${FRAME_QUALITY_BASELINE_FILE} is required`);
  const baseline = JSON.parse(fs.readFileSync(file, "utf8"));
  invariant(baseline?.schemaVersion === 1, "baseline schemaVersion must be 1");
  invariant(baseline?.global && baseline?.sets, "baseline requires global and sets sections");

  const established = loadStudySetPreservationManifest(root).establishedSetIds;
  const baselineIds = Object.keys(baseline.sets).sort((a, b) => a.localeCompare(b));
  invariant(
    JSON.stringify(baselineIds) === JSON.stringify([...established].sort((a, b) => a.localeCompare(b))),
    "baseline set IDs must exactly cover the established study-set preservation manifest",
  );
  return baseline;
}

export function frameQualitySnapshot(audit) {
  const duplicatePatternIds = new Set([
    ...audit.duplicateGroups.exact,
    ...audit.duplicateGroups.slotVariants,
    ...audit.duplicateGroups.nearPairs,
  ].flatMap((item) => item.pattern_ids));
  const highConfidenceAuditIssues = audit.linguisticIssues.filter((item) => item.confidence === "high").length;

  return {
    patternCount: audit.coverage.pattern_count,
    studySetCount: audit.coverage.study_set_count,
    global: {
      duplicateAffectedPatternRate: round(duplicatePatternIds.size / Math.max(1, audit.coverage.pattern_count)),
      highConfidenceAuditIssuesPerPattern: round(highConfidenceAuditIssues / Math.max(1, audit.coverage.pattern_count)),
    },
    sets: Object.fromEntries(Object.entries(audit.setMetrics).sort(([a], [b]) => a.localeCompare(b)).map(([id, metrics]) => [id, {
      duplicateAffectedRate: metrics.duplicate_affected_rate,
      highConfidenceAuditIssuesPerPattern: round(metrics.high_confidence_linguistic_issue_count / Math.max(1, metrics.pattern_count)),
    }])),
  };
}

function assertNotWorse(label, current, baseline) {
  invariant(current <= baseline + EPSILON, `${label} worsened from ${baseline} to ${current}`);
}

export function validateFrameQualityBaseline(audit, baseline = loadFrameQualityBaseline()) {
  const snapshot = frameQualitySnapshot(audit);
  assertNotWorse(
    "global duplicate-affected Pattern rate",
    snapshot.global.duplicateAffectedPatternRate,
    baseline.global.duplicateAffectedPatternRate,
  );
  assertNotWorse(
    "global high-confidence audit issues per Pattern",
    snapshot.global.highConfidenceAuditIssuesPerPattern,
    baseline.global.highConfidenceAuditIssuesPerPattern,
  );

  for (const [setId, expected] of Object.entries(baseline.sets)) {
    const current = snapshot.sets[setId];
    invariant(current, `established study set ${setId} is missing from the audit snapshot`);
    assertNotWorse(`${setId} duplicate-affected rate`, current.duplicateAffectedRate, expected.duplicateAffectedRate);
    assertNotWorse(
      `${setId} high-confidence audit issues per Pattern`,
      current.highConfidenceAuditIssuesPerPattern,
      expected.highConfidenceAuditIssuesPerPattern,
    );
  }

  return snapshot;
}
