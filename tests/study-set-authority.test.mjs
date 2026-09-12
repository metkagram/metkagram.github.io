import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { studySetSlug } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "study-set-authority.json"), "utf8"));
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
const setById = new Map(loadContent().studySets.sets.map((set) => [set.id, set]));

const EXPECTED = ["HED", "ARG", "PRO", "AGR", "CLR", "CMP", "CAU", "CND", "RQT", "NEG", "EVD", "UNC", "FRM", "DEC", "HYP"];

test("authority wave records the bounded 15-set editorial cohort", () => {
  assert.equal(report.cohortId, "authority-wave-1-2026-09-12");
  assert.equal(report.cohortSize, 15);
  assert.deepEqual(report.records.map((record) => record.setId), EXPECTED);
  assert.equal(report.searchEvidence.state, "unobserved");
  assert.equal(report.selectionPolicy.canonicalUrlsPreserved, true);
  assert.equal(report.selectionPolicy.fullInventoryPreserved, true);
  assert.equal(report.selectionPolicy.finalizedIndexablePatternsOnly, true);
});

test("curated Frames are finalized, indexable and structurally distinct", () => {
  for (const record of report.records) {
    assert.ok(record.curatedPatternIds.length >= 1, `${record.setId} needs at least one curated Frame`);
    assert.equal(new Set(record.curatedPatternIds).size, record.curatedPatternIds.length, `${record.setId} pattern IDs must be unique`);
    assert.equal(new Set(record.frameSignatures).size, record.frameSignatures.length, `${record.setId} formula signatures must be distinct`);
    for (const id of record.curatedPatternIds) {
      const pattern = patternById.get(id);
      assert.ok(pattern, `${record.setId} references missing pattern ${id}`);
      assert.equal(pattern.set_id, record.setId, `${id} must remain in ${record.setId}`);
      assert.equal(pattern.quality?.indexable, true, `${id} must pass finalized indexability`);
    }
  }
});

test("authority layer upgrades canonical EN/RU set pages without replacing the existing guide", () => {
  for (const record of report.records) {
    const set = setById.get(record.setId);
    assert.ok(set, `missing set ${record.setId}`);
    for (const locale of ["en", "ru"]) {
      const file = path.join(DIST, locale, "practice", "sets", studySetSlug(set), "index.html");
      const html = fs.readFileSync(file, "utf8");
      assert.ok(html.includes(`data-study-set-authority="${report.cohortId}"`), `${record.setId}/${locale} authority marker`);
      assert.ok(html.includes(`<h1>${record.h1[locale]}</h1>`), `${record.setId}/${locale} learner-job H1`);
      assert.ok(html.includes('id="curated-core-frames"'), `${record.setId}/${locale} curated Frames`);
      assert.ok(html.includes('id="when-to-use"'), `${record.setId}/${locale} when-to-use guidance`);
      assert.ok(html.includes('id="active-retrieval"'), `${record.setId}/${locale} active retrieval`);
      assert.ok(html.includes('id="reviewed-continuation"'), `${record.setId}/${locale} reviewed continuation`);
      assert.ok(html.includes(`href="/${locale}/lens/"`), `${record.setId}/${locale} Pattern Lens continuation`);
      assert.ok(html.indexOf('data-study-set-authority=') < html.indexOf('id="practice-set-guide"'), `${record.setId}/${locale} authority layer precedes the generic guide`);
      for (const id of record.curatedPatternIds) {
        assert.ok(html.includes(`data-curated-pattern="${id}"`), `${record.setId}/${locale} exposes curated ${id}`);
      }
    }
  }
});
