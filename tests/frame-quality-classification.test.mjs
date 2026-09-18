import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const ALLOWED = new Set([
  "exact_duplicate_candidate",
  "contextual_variant_candidate",
  "uncertain_near_duplicate",
  "distinct_frame_candidate",
]);

test("published Frame audit classifies every language record without claiming human review", () => {
  const audit = JSON.parse(fs.readFileSync(path.join(ROOT, "dist", "data", "quality", "frame-audit.json"), "utf8"));
  assert.equal(audit.records.length, audit.coverage.language_record_count);
  for (const record of audit.records) {
    assert.ok(ALLOWED.has(record.classification), `${record.pattern_id}/${record.lang} has an unknown classification`);
    assert.equal(record.human_reviewed, false);
  }
  const hed = audit.records.find((record) => record.pattern_id === "C1HED001" && record.lang === "en");
  assert.equal(hed?.classification, "distinct_frame_candidate", "retained HED canonical record should no longer be classified against retired contextual duplicates");
  assert.equal(audit.records.some((record) => record.pattern_id === "C1HED002"), false, "retired HED alias must not remain an active audit record");
  assert.match(audit.reviewState, /not-human-reviewed/);
});
