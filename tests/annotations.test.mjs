import assert from "node:assert/strict";
import test from "node:test";
import { legacyAnnotationToCanonical, patternToCanonicalCards, renderCanonicalText, validateAnnotation } from "../src/annotation-schema.mjs";

test("legacy annotations migrate to text-first spans with Unicode-safe offsets", () => {
  const record = legacyAnnotationToCanonical({ id: "unicode", original_text: "Ich werde lernen.", text_span: { children: [{ tag: "tag", text: "S" }, { tag: "nsubj", text: "Ich " }, { tag: "tag", text: "Hf" }, { tag: "aux", text: "werde " }, { tag: "ROOT", text: "lernen." }] } }, { language: "de" });
  assert.deepEqual(validateAnnotation(record), []);
  assert.deepEqual(record.spans.map(({ start, end, label }) => [start, end, label]), [[0, 4, "S"], [4, 10, "Hf"]]);
  assert.equal(renderCanonicalText(record, (span, text) => `[${span.label}:${text}]`), "[S:Ich ][Hf:werde ]lernen.");
});

test("pattern cards retain reusable slots, translated examples, and marked spans", () => {
  const [card] = patternToCanonicalCards({ id: "P1", group_id: "request", set_id: "set", metaphor_ru: "explanation", langs: [{ lang: "en", formula: "Could + subject + verb", example: "**Could you** help?", translation: "Не могли бы вы помочь?", examples: [{ text: "**Could you** wait?", translation_ru: "Не могли бы вы подождать?" }] }] });
  assert.deepEqual(validateAnnotation(card), []);
  assert.equal(card.slots[0].label, "Could + subject + verb");
  assert.equal(card.examples[0].translation, "Не могли бы вы подождать?");
  assert.equal(card.text, "Could you help?");
});
