import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { loadContent } from "../src/content.mjs";

const tiers = JSON.parse(fs.readFileSync("data/quality/editorial-tiers.json", "utf8"));

test("editorial tiers reference valid, non-overlapping study sets", () => {
  const content = loadContent();
  const validSetIds = new Set(content.studySets.sets.map((set) => set.id));
  const explicit = new Set();

  assert.equal(tiers.schemaVersion, 1);
  for (const tier of tiers.tiers) {
    assert.ok(["A", "B", "D"].includes(tier.id));
    assert.ok(tier.set_ids.length > 0);
    for (const setId of tier.set_ids) {
      assert.ok(validSetIds.has(setId), `unknown editorial-tier set ${setId}`);
      assert.ok(!explicit.has(setId), `study set ${setId} appears in multiple editorial tiers`);
      explicit.add(setId);
    }
  }

  assert.equal(tiers.fallback.id, "C");
  assert.ok(content.studySets.sets.some((set) => !explicit.has(set.id)), "fallback tier C must cover at least one established set");
});

test("reviewed Pattern overlays are complete and indexable", () => {
  const content = loadContent();
  const byId = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));

  for (const [setId, ids] of Object.entries(tiers.reviewedPatternOverlays || {})) {
    assert.ok(ids.length > 0, `${setId} reviewed overlay must not be empty`);
    for (const id of ids) {
      const pattern = byId.get(id);
      assert.ok(pattern, `reviewed overlay Pattern ${id} does not exist`);
      assert.equal(pattern.set_id, setId, `${id} must stay in ${setId}`);
      assert.equal(pattern.quality.indexable, true, `${id} must pass the corpus indexability gate`);
      assert.equal(pattern.quality.translations_complete, true, `${id} requires complete learner-support translations`);
      assert.ok(pattern.quality.min_unique_examples >= 3, `${id} requires at least three unique examples per language`);
    }
  }
});
