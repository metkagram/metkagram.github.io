import assert from "node:assert/strict";
import test from "node:test";
import { attachFrameFamilies, familyCoverage, practiceCountLabel, validateEditorialFrameFamilies } from "../src/frame-families.mjs";

function fixture() {
  const patterns = ["A", "B", "C"].map((id) => ({ id, set_id: "SET", langs: [{ lang: "en" }, { lang: "de" }] }));
  const studySets = { sets: [{ id: "SET" }, { id: "OTHER" }] };
  const family = { id: "FRAME-SET", set_id: "SET", title_en: "Frame", title_ru: "Каркас", formulas: { en: "I [verb].", de: "Ich [Verb]." }, member_pattern_ids: ["A", "B"], representative_pattern_id: "A", review_status: "editorial-pilot" };
  return { patterns, studySets, catalog: { schemaVersion: 1, families: [family] }, family };
}

test("explicit family membership is additive and leaves unassigned entries unclassified", () => {
  const { patterns, studySets, catalog } = fixture();
  const originalIds = patterns.map((pattern) => pattern.id);
  attachFrameFamilies(patterns, studySets, catalog);
  assert.deepEqual(patterns.map((pattern) => pattern.id), originalIds);
  assert.equal(patterns[0].frame_family_id, "FRAME-SET");
  assert.equal(patterns[2].frame_family_id, undefined);
  assert.equal(studySets.sets[1].frame_families, undefined);
  assert.deepEqual(familyCoverage(studySets.sets[0], patterns), { families: catalog.families, grouped: 2, ungrouped: 1 });
  assert.equal(practiceCountLabel("en", studySets.sets[0], patterns), "3 practice entries");
  assert.equal(practiceCountLabel("en", studySets.sets[0], patterns.slice(0, 2)), "1 frame · 2 variants");
});

test("unknown, cross-set and conflicting family relations fail before publication", () => {
  for (const [mutate, expected] of [
    [(f) => f.family.member_pattern_ids.push("MISSING"), /unknown pattern MISSING/],
    [(f) => f.patterns[1].set_id = "OTHER", /set mismatch/],
    [(f) => f.family.member_pattern_ids.push("A"), /conflicting membership/],
    [(f) => f.catalog.families.push({ ...f.family }), /duplicate or missing family/],
    [(f) => f.catalog.families.push({ ...f.family, id: "ANOTHER" }), /conflicting membership/],
    [(f) => f.family.representative_pattern_id = "C", /representative is not a member/],
    [(f) => delete f.family.formulas.de, /missing de formula/],
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => validateEditorialFrameFamilies(f.catalog, f.patterns, f.studySets.sets), expected);
  }
});
