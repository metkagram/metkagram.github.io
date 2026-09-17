import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadPatternShards } from "../src/pattern-sources.mjs";

const ROOT = process.cwd();

function studySetOrder() {
  const studySets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "study-sets.json"), "utf8"));
  return studySets.sets.map((set) => set.id);
}

test("every canonical pattern has 5–7 examples per learning language", () => {
  const { patterns } = loadPatternShards({ setOrder: studySetOrder() });
  const violations = [];

  for (const pattern of patterns) {
    for (const language of pattern.langs || []) {
      const count = Array.isArray(language.examples) ? language.examples.length : 0;
      if (count < 5 || count > 7) {
        violations.push(`${pattern.set_id}/${pattern.id}/${language.lang}: ${count}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Every canonical pattern language must contain 5–7 examples. Violations (${violations.length}):\n${violations.join("\n")}`
  );
});
