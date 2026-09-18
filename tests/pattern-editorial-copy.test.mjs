import assert from "node:assert/strict";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { patternFrameTitle } from "../src/pattern-editorial-copy.mjs";
import { patternDescription, patternTitle } from "../src/render.mjs";

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

test("every loaded pattern has clean localized title and description copy", () => {
  const content = loadContent();
  assert.ok(content.advancedPatterns.length >= 930, "the full published pattern corpus must be audited");

  for (const pattern of content.advancedPatterns) {
    assert.ok(pattern.title_en?.trim(), `${pattern.id}: missing English title`);
    assert.ok(pattern.title_ru?.trim(), `${pattern.id}: missing Russian title`);
    assert.ok(pattern.description_en?.trim(), `${pattern.id}: missing English description`);
    assert.ok(pattern.description_ru?.trim(), `${pattern.id}: missing Russian description`);

    assert.doesNotMatch(pattern.title_en, /[А-Яа-яЁё]/u, `${pattern.id}: English title contains Russian copy`);
    assert.doesNotMatch(pattern.description_en, /[А-Яа-яЁё]/u, `${pattern.id}: English description contains Russian copy`);
    assert.match(pattern.title_ru, /[А-Яа-яЁё…]/u, `${pattern.id}: Russian title is not localized`);
    assert.match(pattern.description_ru, /[А-Яа-яЁё]/u, `${pattern.id}: Russian description is not localized`);
    assert.doesNotMatch(pattern.title_ru, /[A-Za-z]/u, `${pattern.id}: Russian title contains English text`);
    assert.doesNotMatch(pattern.description_ru, /^Речевая задача:/u, `${pattern.id}: generator description leaked into Russian copy`);

    assert.doesNotMatch(pattern.title_en, /the team needs another day to decide|a funding proposal/iu, `${pattern.id}: English title contains a training example instead of a frame`);
    assert.doesNotMatch(pattern.title_ru, /команде нужен ещё день для решения|заявк[аиу] на финансирование/iu, `${pattern.id}: Russian title contains a training example instead of a frame`);
  }
});

test("representative synthetic, grammar and legacy titles are clear in both locales", () => {
  const content = loadContent();
  const byId = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));

  const arg = byId.get("C1ARG001");
  assert.ok(arg);
  assert.equal(arg.title_en, "The case for [X] rests on the assumption that [Y]");
  assert.equal(arg.title_ru, "Аргумент в пользу … основан на предположении, что …");
  assert.match(arg.description_ru, /допущен/u);
  assert.match(arg.description_en, /assumption/u);

  const advice = byId.get("FUNADV001");
  assert.ok(advice);
  assert.equal(advice.title_en, "I would recommend checking whether [X]");
  assert.equal(advice.title_ru, "Я бы рекомендовал(а) проверить, …");
  assert.match(advice.description_ru, /Мягко предлагает/u);

  const discourseQuestion = byId.get("QSTQDIS001");
  assert.ok(discourseQuestion);
  assert.equal(discourseQuestion.title_en, "Before we continue, can we clarify whether [X]?");
  assert.equal(discourseQuestion.title_ru, "Прежде чем продолжить, можем ли мы прояснить, …?");
  assert.match(discourseQuestion.description_ru, /прояснить/u);

  const grammar = byId.get("GFI001");
  assert.ok(grammar);
  assert.equal(grammar.title_ru, "Помнить о прошлом действии");
  assert.doesNotMatch(grammar.title_ru, /[A-Za-z]/u);

  const legacy = byId.get("COM001");
  assert.ok(legacy);
  assert.equal(legacy.title_ru, "Чем больше..., тем больше...");
});

test("renderer selects title and description by interface locale", () => {
  const pattern = loadContent().advancedPatterns.find((item) => item.id === "C1ARG001");
  assert.ok(pattern);
  assert.equal(patternTitle(pattern, "ru"), pattern.title_ru);
  assert.equal(patternTitle(pattern, "en"), pattern.title_en);
  assert.equal(patternDescription(pattern, "ru"), pattern.description_ru);
  assert.equal(patternDescription(pattern, "en"), pattern.description_en);
});
