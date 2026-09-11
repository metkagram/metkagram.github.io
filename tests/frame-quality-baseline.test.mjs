import assert from "node:assert/strict";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import {
  loadFrameQualityBaseline,
  validateFrameQualityBaseline,
} from "../src/frame-quality-baseline.mjs";
import { buildFrameQualityAudit } from "../src/frame-quality-audit.mjs";
import { loadStudySetPreservationManifest } from "../src/study-set-preservation.mjs";

function currentAudit() {
  return buildFrameQualityAudit(loadContent());
}

test("current corpus passes the frozen Frame quality baseline", () => {
  const snapshot = validateFrameQualityBaseline(currentAudit());
  assert.equal(snapshot.patternCount, 3530);
  assert.equal(snapshot.studySetCount, 94);
  assert.equal(snapshot.global.duplicateAffectedPatternRate, 0.907082);
  assert.equal(snapshot.global.highConfidenceAuditIssuesPerPattern, 0.011898);
});

test("Frame quality baseline covers every permanently established study set", () => {
  const baseline = loadFrameQualityBaseline();
  const established = loadStudySetPreservationManifest().establishedSetIds;
  assert.deepEqual(Object.keys(baseline.sets).sort(), [...established].sort());
});

test("an established set cannot silently worsen its duplicate rate", () => {
  const audit = structuredClone(currentAudit());
  audit.setMetrics.CDG.duplicate_affected_rate = 0.1;
  assert.throws(
    () => validateFrameQualityBaseline(audit),
    /CDG duplicate-affected rate worsened from 0 to 0\.1/,
  );
});

test("an established set cannot silently gain high-confidence audit issues", () => {
  const audit = structuredClone(currentAudit());
  audit.setMetrics.CDG.high_confidence_linguistic_issue_count = 1;
  assert.throws(
    () => validateFrameQualityBaseline(audit),
    /CDG high-confidence audit issues per Pattern worsened from 0/,
  );
});
