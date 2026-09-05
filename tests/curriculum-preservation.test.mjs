import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { checkCurriculumPreservation, createCurriculumSnapshot } from "../src/corpus-audit.mjs";
import { legacyPatternPath, legacyStudySetPath, patternPath, studySetPath } from "../src/seo-slugs.mjs";

function fixture() {
  const content = {
    studySets: { sets: [{ id: "AAA" }, { id: "BBB" }] },
    advancedPatterns: [{ id: "P1", set_id: "AAA", title_ru: "Первый" }, { id: "P2", set_id: "BBB", title_ru: "Второй" }]
  };
  const registry = { studySets: { AAA: "first-set", BBB: "second-set" }, patterns: { P1: "first-pattern", P2: "second-pattern" } };
  const baseline = createCurriculumSnapshot(content, registry);
  return { content, registry, baseline };
}

test("editorial improvements and additions preserve the existing curriculum", () => {
  const { content, registry, baseline } = fixture();
  content.advancedPatterns[0].title_ru = "Исправленный текст и полезные примеры";
  content.studySets.sets[0].description = "A clearer description";
  assert.equal(checkCurriculumPreservation(content, registry, baseline).passed, true);
  content.studySets.sets.push({ id: "CCC" });
  content.advancedPatterns.push({ id: "P3", set_id: "CCC" }, { id: "P4", set_id: "AAA" });
  registry.studySets.CCC = "new-set";
  registry.patterns.P3 = "new-pattern";
  registry.patterns.P4 = "another-pattern";
  const result = checkCurriculumPreservation(content, registry, baseline);
  assert.equal(result.passed, true);
  assert.deepEqual(result.added_set_ids, ["CCC"]);
  assert.deepEqual(result.added_pattern_ids, ["P3", "P4"]);
  assert.equal(result.protected_set_count, 2);
  assert.equal(result.protected_pattern_count, 2);
});

test("removing a set or existing member cannot be hidden by retaining the same total count", () => {
  const { content, registry, baseline } = fixture();
  content.advancedPatterns[0] = { id: "P3", set_id: "AAA" };
  registry.patterns.P3 = "replacement";
  let result = checkCurriculumPreservation(content, registry, baseline);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.code === "PATTERN_REMOVED" && error.pattern_id === "P1"));
  content.studySets.sets = content.studySets.sets.filter((set) => set.id !== "AAA");
  content.advancedPatterns = content.advancedPatterns.filter((pattern) => pattern.set_id !== "AAA");
  result = checkCurriculumPreservation(content, registry, baseline);
  assert.ok(result.errors.some((error) => error.code === "SET_REMOVED" && error.set_id === "AAA"));
});

test("membership swaps fail even when every set keeps the same count and IDs survive", () => {
  const { content, registry, baseline } = fixture();
  content.advancedPatterns[0].set_id = "BBB";
  content.advancedPatterns[1].set_id = "AAA";
  const result = checkCurriculumPreservation(content, registry, baseline);
  assert.equal(result.passed, false);
  assert.equal(result.errors.filter((error) => error.code === "MEMBERSHIP_CHANGED").length, 2);
});

test("set and pattern URL slug changes fail independently", () => {
  const { content, registry, baseline } = fixture();
  registry.studySets.AAA = "renamed-set";
  registry.patterns.P2 = "renamed-pattern";
  const result = checkCurriculumPreservation(content, registry, baseline);
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.code === "SET_SLUG_CHANGED" && error.set_id === "AAA"));
  assert.ok(result.errors.some((error) => error.code === "PATTERN_SLUG_CHANGED" && error.pattern_id === "P2"));
});

test("missing registries, duplicate identities and malformed baselines fail closed", () => {
  const { content, registry, baseline } = fixture();
  assert.throws(() => checkCurriculumPreservation(content, registry, { schemaVersion: 1, sets: {}, patternSlugs: {} }), /must not be empty/);
  const broken = structuredClone(baseline);
  broken.sets.AAA.pattern_ids = ["P2"];
  assert.throws(() => checkCurriculumPreservation(content, registry, broken), /multiple sets/);
  delete registry.patterns.P1;
  assert.throws(() => checkCurriculumPreservation(content, registry, baseline), /missing or invalid pattern slug P1/);
  registry.patterns.P1 = "first-pattern";
  content.advancedPatterns.push({ ...content.advancedPatterns[0] });
  assert.throws(() => checkCurriculumPreservation(content, registry, baseline), /duplicate pattern P1/);
});

test("all published pre-improvement sets, memberships and canonical and legacy routes remain available", () => {
  const baseline = JSON.parse(fs.readFileSync("data/curriculum-preservation.json", "utf8"));
  const registry = JSON.parse(fs.readFileSync("data/seo-slugs.json", "utf8"));
  const content = loadContent();
  assert.equal(baseline.sourceRevision, "b194e9c741d65d6515aa71b5dc614044b859b1e2", "the original protection baseline is not a generated build artifact");
  assert.equal(Object.keys(baseline.sets).length, 94);
  assert.equal(Object.keys(baseline.patternSlugs).length, 3530);
  const result = checkCurriculumPreservation(content, registry, baseline);
  assert.equal(result.passed, true, JSON.stringify(result.errors, null, 2));
  for (const locale of ["en", "ru"]) {
    for (const [id, set] of Object.entries(baseline.sets)) {
      assert.equal(studySetPath(locale, { id }), `/${locale}/practice/sets/${set.slug}/`);
      assert.equal(legacyStudySetPath(locale, { id }), `/${locale}/practice/set/${id.toLowerCase()}/`);
    }
    for (const [id, slug] of Object.entries(baseline.patternSlugs)) {
      assert.equal(patternPath(locale, id), `/${locale}/practice/patterns/${slug}/`);
      assert.equal(legacyPatternPath(locale, id), `/${locale}/practice/${id.toLowerCase()}/`);
    }
  }
});
