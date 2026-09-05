import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { buildFrameQualityAudit, normalizeFrameFormula } from "../src/frame-quality-audit.mjs";

const ROOT = process.cwd();

function duplicatePatternIds(audit) {
  return new Set([
    ...audit.duplicateGroups.exact,
    ...audit.duplicateGroups.slotVariants,
    ...audit.duplicateGroups.nearPairs,
  ].flatMap((item) => item.pattern_ids));
}

test("Frame audit covers every current study set and Pattern record", () => {
  const content = loadContent();
  const audit = buildFrameQualityAudit(content);
  assert.equal(audit.coverage.study_set_count, content.studySets.sets.length);
  assert.equal(audit.coverage.audited_set_count, content.studySets.sets.length);
  assert.equal(audit.coverage.pattern_count, content.advancedPatterns.length);
  assert.equal(audit.coverage.audited_pattern_count, content.advancedPatterns.length);
  assert.equal(
    audit.coverage.language_record_count,
    content.advancedPatterns.reduce((sum, pattern) => sum + pattern.langs.length, 0),
  );
  assert.equal(Object.keys(audit.setMetrics).length, content.studySets.sets.length);
});

test("slot normalization exposes the known HED contextual-variant family", () => {
  const content = loadContent();
  const audit = buildFrameQualityAudit(content);
  const hed = audit.duplicateGroups.slotVariants.find((group) =>
    group.set_id === "HED"
    && group.lang === "en"
    && group.pattern_ids.includes("C1HED001")
    && group.pattern_ids.includes("C1HED002")
  );
  assert.ok(hed, "HED contextual substitutions should resolve to one reviewable Frame-family candidate");
  assert.equal(
    normalizeFrameFormula("It would be premature to conclude that [a funding proposal] is settled.", { abstractSlots: true }),
    normalizeFrameFormula("It would be premature to conclude that [a delayed product launch] is settled.", { abstractSlots: true }),
  );
});

test("automated audit never promotes heuristic findings to human review", () => {
  const audit = buildFrameQualityAudit(loadContent());
  for (const group of [...audit.duplicateGroups.exact, ...audit.duplicateGroups.slotVariants, ...audit.duplicateGroups.nearPairs]) {
    assert.equal(group.human_reviewed, false);
  }
  for (const item of audit.linguisticIssues) assert.equal(item.human_reviewed, false);
  for (const item of audit.remediationQueue) assert.equal(item.human_reviewed, false);
});

test("every finding retains stable Pattern and study-set references", () => {
  const content = loadContent();
  const audit = buildFrameQualityAudit(content);
  const patternIds = new Set(content.advancedPatterns.map((pattern) => pattern.id));
  const setIds = new Set(content.studySets.sets.map((set) => set.id));
  for (const id of duplicatePatternIds(audit)) assert.ok(patternIds.has(id), `unknown duplicate candidate ${id}`);
  for (const item of audit.linguisticIssues) {
    assert.ok(patternIds.has(item.pattern_id), `unknown QA candidate ${item.pattern_id}`);
    assert.ok(setIds.has(item.set_id), `unknown study set ${item.set_id}`);
  }
});

test("Frame audit is byte-deterministic for unchanged canonical content", () => {
  const content = loadContent();
  const first = JSON.stringify(buildFrameQualityAudit(content));
  const second = JSON.stringify(buildFrameQualityAudit(content));
  assert.equal(second, first);
});

test("derive publishes machine-readable and human-readable Frame audit artifacts", () => {
  const jsonFile = path.join(ROOT, "dist", "data", "quality", "frame-audit.json");
  const markdownFile = path.join(ROOT, "dist", "data", "quality", "frame-audit.md");
  assert.ok(fs.existsSync(jsonFile), "missing dist/data/quality/frame-audit.json");
  assert.ok(fs.existsSync(markdownFile), "missing dist/data/quality/frame-audit.md");
  const audit = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  assert.equal(audit.coverage.audited_pattern_count, audit.coverage.pattern_count);
  assert.equal(audit.coverage.audited_set_count, audit.coverage.study_set_count);
  assert.match(fs.readFileSync(markdownFile, "utf8"), /review candidates/i);
});
