import assert from "node:assert/strict";
import test from "node:test";

import { loadContent } from "../src/content.mjs";

const ACTIVE_PRACTICE_SET_IDS = ["CGR", "SPK", "INT", "REG", "RTR", "TRN"];

test("active-practice sets keep a useful minimum breadth", () => {
  const content = loadContent();

  for (const setId of ACTIVE_PRACTICE_SET_IDS) {
    const patterns = content.advancedPatterns.filter((pattern) => pattern.set_id === setId);
    assert.ok(patterns.length >= 6, `${setId} should keep at least six curated active-practice patterns`);

    for (const pattern of patterns) {
      assert.equal(pattern.quality?.indexable, true, `${pattern.id} should stay indexable after editorial review`);
      assert.ok(pattern.quality?.min_unique_examples >= 5, `${pattern.id} should expose at least five unique examples per language`);
      assert.equal(pattern.quality?.translations_complete, true, `${pattern.id} should keep complete Russian learner translations`);
      assert.equal(pattern.quality?.has_variation_duplicates, false, `${pattern.id} should not contain duplicate variations`);
    }
  }
});
