import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { legacyAnnotationToCanonical, patternToCanonicalCards, renderCanonicalText, validateAnnotation } from "../src/annotation-schema.mjs";

test("legacy annotations migrate to text-first spans with Unicode-safe offsets", () => {
  const record = legacyAnnotationToCanonical({ id: "unicode", original_text: "Ich werde lernen.", text_span: { children: [{ tag: "tag", text: "S" }, { tag: "nsubj", text: "Ich " }, { tag: "tag", text: "Hf" }, { tag: "aux", text: "werde " }, { tag: "ROOT", text: "lernen." }] } }, { language: "de" });
  assert.deepEqual(validateAnnotation(record), []);
  assert.deepEqual(record.spans.map(({ start, end, label }) => [start, end, label]), [[0, 4, "S"], [4, 10, "Hf"]]);
  assert.equal(renderCanonicalText(record, (span, text) => `[${span.label}:${text}]`), "[S:Ich ][Hf:werde ]lernen.");
});

test("German legacy annotations preserve gender colors and past-tense markers", () => {
  const record = legacyAnnotationToCanonical({
    id: "german-morphology",
    original_text: "Die Frau gewann mit dem Mann.",
    text_span: { children: [
      { tag: "", text: "Die " },
      { tag: "tag", text: "S" },
      { tag: "FEM", text: "Frau " },
      { tag: "tag", text: "V", extra: "Past" },
      { tag: "ROOT", text: "gewann " },
      { tag: "", text: "mit dem " },
      { tag: "MASC", text: "Mann" },
      { tag: "punct", text: "." }
    ] }
  }, { language: "de" });
  assert.deepEqual(validateAnnotation(record), []);
  assert.equal(record.spans.find((span) => span.label === "S").gender, "feminine");
  assert.equal(record.spans.find((span) => span.label === "V").tense, "past");
  assert.deepEqual(record.spans.find((span) => span.role === "gender"), {
    id: "german-morphology-s3", start: 24, end: 28, type: "function", label: "Gender", role: "gender", gender: "masculine"
  });
});

test("German-only morphology signals are not added to English records", () => {
  const record = legacyAnnotationToCanonical({ id: "english-control", original_text: "The time passed.", text_span: { children: [{ tag: "FEM", text: "The time " }, { tag: "tag", text: "V", extra: "Past" }, { tag: "ROOT", text: "passed" }, { tag: "punct", text: "." }] } }, { language: "en" });
  assert.equal(record.spans.some((span) => span.gender || span.tense), false);
});

test("pattern cards retain reusable slots, translated examples, and marked spans", () => {
  const [card] = patternToCanonicalCards({ id: "P1", group_id: "request", set_id: "set", metaphor_ru: "explanation", langs: [{ lang: "en", formula: "Could + subject + verb", example: "**Could you** help?", translation: "Не могли бы вы помочь?", examples: [{ text: "**Could you** wait?", translation_ru: "Не могли бы вы подождать?" }] }] });
  assert.deepEqual(validateAnnotation(card), []);
  assert.equal(card.slots[0].label, "Could + subject + verb");
  assert.equal(card.examples[0].translation, "Не могли бы вы подождать?");
  assert.equal(card.text, "Could you help?");
});

test("service-produced pattern annotations replace authored-only emphasis", () => {
  const pattern = { id: "P2", group_id: "request", set_id: "set", langs: [{ lang: "en", formula: "Will + subject + verb", example: "I will learn.", examples: [{ text: "We will practise.", translation_ru: "Мы будем практиковаться." }] }] };
  const service = { "P2:en:primary": { id: "service-primary", text: "I will learn.", spans: [{ id: "s1", start: 0, end: 1, type: "subject", label: "S" }], validation: { generator: "spacy-dependency" } }, "P2:en:1": { id: "service-example", text: "We will practise.", spans: [{ id: "s1", start: 0, end: 2, type: "subject", label: "S" }], validation: { generator: "spacy-dependency" } } };
  const [card] = patternToCanonicalCards(pattern, service);
  assert.equal(card.spans[0].label, "S");
  assert.equal(card.examples[0].spans[0].label, "S");
});

test("support-language preference is available globally and keeps translations opt-in", () => {
  const root = process.cwd();
  const html = fs.readFileSync(path.join(root, "dist/en/practice/con003/index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "public/assets/app.js"), "utf8");
  assert.match(html, /data-native-language-control/);
  assert.match(html, /data-native-translation hidden/);
  assert.match(html, /Translations and explanations in your language are not available yet/);
  assert.match(script, /metkagram:native-language/);
  assert.match(script, /next !== "ru"/);
});
