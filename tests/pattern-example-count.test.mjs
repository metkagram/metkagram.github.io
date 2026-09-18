import { loadContent } from "../src/content.mjs";
import { hasPendingExampleEnrichment } from "../src/pattern-example-enrichment.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadPatternShards } from "../src/pattern-sources.mjs";

const ROOT = process.cwd();

function studySetOrder() {
  const studySets = loadContent().studySets;
  return studySets.sets.map((set) => set.id);
}

test("canonical patterns meet 5–7 examples or an explicit owner-approved pending-enrichment entry", () => {
  const { patterns } = loadPatternShards({ setOrder: studySetOrder() });
  const violations = [];

  for (const pattern of patterns) {
    const languages = Array.isArray(pattern.langs) ? pattern.langs : [];
    if (languages.length === 0) {
      violations.push(`${pattern.set_id}/${pattern.id}: no learning-language records`);
      continue;
    }

    for (const language of languages) {
      const count = Array.isArray(language.examples) ? language.examples.length : 0;
      if ((count < 5 || count > 7) && !hasPendingExampleEnrichment(pattern, language)) {
        violations.push(`${pattern.set_id}/${pattern.id}/${language.lang}: ${count}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Every canonical pattern language must contain 5–7 examples or exactly match a documented pending-enrichment entry. Violations (${violations.length}):\n${violations.join("\n")}`
  );
});
