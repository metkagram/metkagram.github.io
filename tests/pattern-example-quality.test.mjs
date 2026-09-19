import { minimumShardCount } from './helpers/curriculum-contract.mjs';
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { hasPendingExampleEnrichment } from "../src/pattern-example-enrichment.mjs";

import {
  C1_EXAMPLE_DIVERSITY_RULE,
  GENERATED_FOLLOW_UPS,
  PRACTICE_EXAMPLE_DIVERSITY_RULE,
  hasGeneratedFollowUp,
  measurePatternExampleDiversity,
  patternExampleDiversityProblems,
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
  assert.ok(patterns.length >= minimumShardCount, "established shards and all grammar additions must be inspected");
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


test("example diversity gate rejects slot-substitution near-clones", () => {
  const repetitive = {
    lang: "en",
    formula: "The case for [X] rests on the assumption that [Y].",
    examples: [
      { text: "The case for a funding proposal rests on the assumption that the benefits outweigh the cost." },
      { text: "The case for a product launch rests on the assumption that the benefits outweigh the cost." },
      { text: "The case for a staffing plan rests on the assumption that the benefits outweigh the cost." },
      { text: "The case for a supplier change rests on the assumption that the benefits outweigh the cost." },
      { text: "The case for a transport plan rests on the assumption that the benefits outweigh the cost." }
    ]
  };
  const metrics = measurePatternExampleDiversity(repetitive);
  assert.ok(metrics.meanPairwiseJaccard > 0.64 || metrics.sharedTokenRatio > 0.58);
  assert.ok(patternExampleDiversityProblems(repetitive).length > 0);
});


test("diversity gate discounts the fixed grammatical scaffold but not the variable content", () => {
  const varied = {
    lang: "en",
    formula: "One practical step would be to [do X].",
    examples: [
      { text: "One practical step would be to ask the supplier for a written delivery date." },
      { text: "One practical step would be to test the export with a small customer sample." },
      { text: "One practical step would be to schedule a ten-minute review before launch." },
      { text: "One practical step would be to compare the offers against the same criteria." },
      { text: "One practical step would be to record the explanation and review unclear wording." },
      { text: "One practical step would be to move the router and retest the signal." },
      { text: "One practical step would be to write down our least certain assumption." }
    ]
  };
  const metrics = measurePatternExampleDiversity(varied);
  assert.ok(metrics.structuralSharedTokenCount > 0);
  assert.ok(metrics.rawSharedTokenCount > metrics.sharedTokenCount);
  assert.deepEqual(patternExampleDiversityProblems(varied, PRACTICE_EXAMPLE_DIVERSITY_RULE), []);
});

test("canonical C1 examples are varied enough for productive speaking practice", () => {
  const patterns = readRawPatterns().filter((pattern) => /^C1[A-Z]+\d+$/.test(pattern.id));
  assert.ok(patterns.length >= 20, "the canonical C1 communication layer must be covered");

  for (const pattern of patterns) {
    for (const language of pattern.langs || []) {
      const problems = patternExampleDiversityProblems(language, C1_EXAMPLE_DIVERSITY_RULE);
      const metrics = measurePatternExampleDiversity(language);
      assert.deepEqual(
        problems,
        [],
        `${pattern.id}/${language.lang}: ${problems.join("; ")}; metrics=${JSON.stringify(metrics)}`
      );
    }
  }
});


test("all canonical English and German example sets meet the speaking-practice diversity floor", () => {
  const patterns = readRawPatterns();

  for (const pattern of patterns) {
    for (const language of pattern.langs || []) {
      if (!["en", "de"].includes(language.lang)) continue;
      if (hasPendingExampleEnrichment(pattern, language)) continue;
      const problems = patternExampleDiversityProblems(language, PRACTICE_EXAMPLE_DIVERSITY_RULE);
      const metrics = measurePatternExampleDiversity(language);
      assert.deepEqual(
        problems,
        [],
        `${pattern.id}/${language.lang}: ${problems.join("; ")}; metrics=${JSON.stringify(metrics)}`
      );
    }
  }
});
