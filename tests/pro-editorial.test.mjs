import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const { patterns } = JSON.parse(fs.readFileSync(new URL("../data/patterns/PRO.json", import.meta.url), "utf8"));
const plain = (value) => value.replaceAll("**", "").replace(/[\[\]]/g, "");

function sentences(lang) {
  return patterns.flatMap((pattern) => [
    ...pattern.formulas.filter((formula) => formula.startsWith(lang === "en" ? "I am writing" : "Ich schreibe")),
    ...pattern.langs.filter((entry) => entry.lang === lang).flatMap((entry) => [
      entry.formula,
      entry.example,
      ...entry.examples.map((example) => example.text),
    ]),
  ]).map(plain);
}

test("PRO English findings and results take a plural verb in every published representation", () => {
  let pluralExamples = 0;
  for (const sentence of sentences("en")) {
    const clause = sentence.match(/^I am writing to clarify how (.+) (affects?) the next steps\.$/);
    assert.ok(clause, sentence);
    const plural = /\b(findings|results)$/.test(clause[1]);
    assert.equal(clause[2], plural ? "affect" : "affects", sentence);
    pluralExamples += Number(plural);
  }
  assert.ok(pluralExamples > 0, "plural-subject examples must remain in the learning material");
});

test("PRO German subordinate subjects use nominative case and agree with the final verb", () => {
  let pluralExamples = 0;
  for (const sentence of sentences("de")) {
    const clause = sentence.match(/^Ich schreibe, um zu erläutern, wie (.+) die nächsten Schritte (beeinflusst|beeinflussen)\.$/);
    assert.ok(clause, sentence);
    assert.doesNotMatch(clause[1], /^einen\b|^ein (?:neuen|vorgeschlagenen)\b/, sentence);
    const plural = /\b(?:Forschungsergebnisse|Ergebnisse)\b/.test(clause[1]);
    assert.equal(clause[2], plural ? "beeinflussen" : "beeinflusst", sentence);
    pluralExamples += Number(plural);
  }
  assert.ok(pluralExamples > 0, "German plural-subject examples must remain available");
});

test("PRO Russian translations agree with plural results and debates independently of English number", () => {
  const russian = patterns.flatMap((pattern) => [
    pattern.title_ru,
    pattern.metaphor_ru,
    ...pattern.langs.flatMap((entry) => [entry.translation, ...entry.examples.map((example) => example.translation_ru)]),
  ]);
  let pluralExamples = 0;
  for (const sentence of russian) {
    const clause = sentence.match(/как (.+?) (влияет|влияют) на (?:дальнейшие действия|следующие шаги)(?:[.»]|$)/);
    assert.ok(clause, sentence);
    const plural = /(?:^| )(?:результаты|дебаты)(?: |$)/.test(clause[1]);
    assert.equal(clause[2], plural ? "влияют" : "влияет", sentence);
    assert.doesNotMatch(sentence, /[a-z]/i, "Russian learner text must not retain English slot text");
    pluralExamples += Number(plural);
  }
  assert.ok(pluralExamples > 0, "Russian plural examples must remain available");
});

test("PRO existing pattern links and complete bilingual practice examples remain available", () => {
  for (let index = 1; index <= 40; index += 1) {
    const id = `C1PRO${String(index).padStart(3, "0")}`;
    const pattern = patterns.find((entry) => entry.id === id);
    assert.ok(pattern, `${id} must retain its established identity`);
    assert.equal(pattern.set_id, "PRO");
    assert.deepEqual(pattern.langs.map((entry) => entry.lang), ["en", "de"]);
    assert.deepEqual(pattern.formulas, pattern.langs.map((entry) => entry.formula), `${id}: duplicated formula fields must agree`);
    for (const entry of pattern.langs) {
      assert.ok(entry.examples.length >= 8, `${id}/${entry.lang}: retain the practice examples`);
      assert.equal(plain(entry.formula), entry.example);
      assert.equal(plain(entry.examples[0].text), entry.example);
      assert.equal(entry.examples[0].translation_ru, entry.translation);
      assert.ok(entry.examples.every((example) => example.text && example.translation_ru));
    }
  }
});
