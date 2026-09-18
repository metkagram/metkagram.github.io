import assert from "node:assert/strict";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { patternFrameTitle } from "../src/pattern-editorial-copy.mjs";

test("formula titles keep the reusable frame and remove example-specific slot text", () => {
  assert.equal(
    patternFrameTitle("The case for [a funding proposal] rests on the assumption that [claim]."),
    "The case for [X] rests on the assumption that [Y]"
  );
  assert.equal(
    patternFrameTitle("Could you confirm whether [the team needs another day to decide]?"),
    "Could you confirm whether [X]?"
  );
});

test("synthetic pattern copy is editorialized across the loaded corpus", () => {
  const content = loadContent();
  for (const pattern of content.advancedPatterns) {
    assert.doesNotMatch(pattern.metaphor_ru || "", /^Речевая задача:/u, `${pattern.id} still exposes generator copy`);
  }

  const arg = content.advancedPatterns.find((pattern) => pattern.id === "C1ARG001");
  assert.ok(arg);
  assert.equal(arg.title_ru, "The case for [X] rests on the assumption that [Y]");
  assert.match(arg.metaphor_ru, /допущен/u);
  assert.doesNotMatch(arg.title_ru, /финансирован/u);

  const advice = content.advancedPatterns.find((pattern) => pattern.id === "FUNADV001");
  assert.ok(advice);
  assert.equal(advice.title_ru, "I would recommend checking whether [X]");
  assert.match(advice.metaphor_ru, /Мягко предлагает/u);

  const discourseQuestion = content.advancedPatterns.find((pattern) => pattern.id === "QSTQDIS001");
  assert.ok(discourseQuestion);
  assert.equal(discourseQuestion.title_ru, "Before we continue, can we clarify whether [X]?");
  assert.match(discourseQuestion.metaphor_ru, /прояснить/u);

  const legacy = content.advancedPatterns.find((pattern) => pattern.id === "COM001");
  assert.ok(legacy);
  assert.equal(legacy.title_ru, "Чем больше..., тем больше...");
});
