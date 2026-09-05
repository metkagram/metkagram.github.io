import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = JSON.parse(fs.readFileSync(new URL("../data/patterns/ARG.json", import.meta.url), "utf8"));
const records = source.patterns;
const unmark = (text) => text.replaceAll("**", "");

test("ARG editorial repair retains the curriculum IDs and bilingual practice volume", () => {
  assert.equal(source.set_id, "ARG");
  assert.deepEqual(records.map((record) => record.id), Array.from({ length: 40 }, (_, index) => `C1ARG${String(index + 1).padStart(3, "0")}`));
  for (const record of records) {
    assert.equal(record.set_id, "ARG");
    assert.equal(record.group_id, "ARG");
    assert.deepEqual(record.langs.map((lang) => lang.lang), ["en", "de"]);
    for (const lang of record.langs) {
      assert.equal(lang.examples.length, 8, `${record.id}/${lang.lang}`);
      assert.equal(lang.example, unmark(lang.examples[0].text), `${record.id}/${lang.lang}: primary example must not retain stale text`);
      assert.equal(lang.translation, lang.examples[0].translation_ru);
    }
    assert.deepEqual(record.formulas, record.langs.map((lang) => lang.formula));
  }
});

test("ARG Russian copy has no untranslated English fragments", () => {
  for (const record of records) {
    const russian = [record.title_ru, record.metaphor_ru, ...record.langs.flatMap((lang) => [lang.translation, ...lang.examples.map((example) => example.translation_ru)])];
    for (const text of russian) {
      assert.match(text, /[А-Яа-яЁё]/u, record.id);
      assert.doesNotMatch(text, /[A-Za-z]/u, `${record.id}: unexpected untranslated fragment`);
    }
  }
});

test("ARG examples express distinct assumptions instead of recycling the same cross-context sentence", () => {
  for (const language of ["en", "de"]) {
    const examples = records.flatMap((record) => record.langs.find((lang) => lang.lang === language).examples.map((example) => unmark(example.text)));
    assert.equal(new Set(examples).size, 320, `${language}: each contextual example must contribute a distinct sentence`);
    for (const example of examples) {
      assert.doesNotMatch(example, /the benefits outweigh the short-term cost|die Vorteile die kurzfristigen Kosten überwiegen/);
      if (language === "de") assert.doesNotMatch(example, /\bthe\b|\bclaim\b|\bbenefits\b/i);
    }
  }
});

test("ARG problematic contexts argue for a response rather than for a fault or conflict", () => {
  const english = Object.fromEntries(records.map((record) => [record.id, record.langs.find((lang) => lang.lang === "en").example]));
  assert.match(english.C1ARG003, /case for applying the team's research findings/);
  assert.match(english.C1ARG004, /case for investigating the customer complaint/);
  assert.match(english.C1ARG022, /case for a planned service outage for maintenance/);
  assert.match(english.C1ARG027, /case for mediation in the workplace conflict/);
});
