import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  GENERATED_FOLLOW_UPS,
  hasGeneratedFollowUp,
  stripGeneratedFollowUp,
} from "../src/pattern-example-quality.mjs";

const ROOT = process.cwd();
const SHARD_DIR = path.join(ROOT, "data", "patterns");

function readRawPatterns() {
  return fs.readdirSync(SHARD_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => JSON.parse(fs.readFileSync(path.join(SHARD_DIR, name), "utf8")).patterns);
}

function assertClean(value, language, context) {
  if (typeof value !== "string" || !value) return;
  assert.equal(
    hasGeneratedFollowUp(value, language),
    false,
    `${context} still ends with a retired generated follow-up: ${value}`
  );
}

test("generated follow-up detector covers current and legacy padding", () => {
  assert.equal(GENERATED_FOLLOW_UPS.en.length, 20);
  assert.equal(GENERATED_FOLLOW_UPS.de.length, 20);
  assert.equal(GENERATED_FOLLOW_UPS.ru.length, 20);

  const source = "No matter how fast technology advances, we must adapt. The team will discuss it before deciding how to proceed.";
  const cleaned = stripGeneratedFollowUp(source, "en");
  assert.equal(cleaned.value, "No matter how fast technology advances, we must adapt.");
  assert.equal(cleaned.removed, 1);

  const legacy = "Short example. This gives the team a clearer basis for the next decision.";
  assert.equal(stripGeneratedFollowUp(legacy, "en").value, "Short example.");
});

test("canonical pattern shards contain no retired generated follow-up tails", () => {
  const patterns = readRawPatterns();
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "pattern-corpus-baseline.json"), "utf8"));
  assert.equal(
    patterns.length,
    baseline.structuralDeduplication.canonicalBasePatternCount,
    "expected the complete canonical deduplicated base corpus",
  );
  assert.ok(patterns.some((pattern) => pattern.id === "CLA002"), "CLA002 must remain in the corpus");

  for (const pattern of patterns) {
    for (const language of pattern.langs || []) {
      const base = `${pattern.id}:${language.lang}`;
      assertClean(language.example, language.lang, `${base}:example`);
      assertClean(language.translation, "ru", `${base}:translation`);
      assertClean(language.translation_ru, "ru", `${base}:translation_ru`);

      for (const [index, example] of (language.examples || []).entries()) {
        assertClean(example.text, language.lang, `${base}:examples[${index}].text`);
        assertClean(example.translation_ru, "ru", `${base}:examples[${index}].translation_ru`);
        assertClean(example.translation, "ru", `${base}:examples[${index}].translation`);
      }
    }
  }
});
