import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";

const ROOT = process.cwd();

test("the Practice annotation layer covers every current source sentence without inventing rebuilt Marks", () => {
  const content = loadContent();
  const { payload, items, pendingPatternIds, overlayPendingCount } = loadPracticeAnnotationLayer(content, ROOT);
  assert.equal(payload.schema_version, "1.0.0");
  if (payload.generator === "mixed-local-annotations-and-explicit-pending-records") {
    assert.equal(payload.previous_generator, "local-spacy-dependency");
  } else {
    assert.equal(payload.generator, "local-spacy-dependency");
  }

  let expected = 0;
  for (const pattern of content.advancedPatterns) for (const language of pattern.langs) {
    const references = [{ key: "primary", text: language.example }, ...(language.examples || []).map((example, index) => ({ key: String(index + 1), text: example.text }))];
    for (const reference of references) {
      expected += 1;
      const key = `${pattern.id}:${language.lang}:${reference.key}`;
      const annotation = items[key];
      assert.ok(annotation, `missing ${key}`);
      assert.equal(annotation.text, cleanMarkedText(reference.text), `${key} text changed`);
      assert.equal(annotation.inline_text, cleanMarkedText(reference.text), `${key} inline text changed`);
      assert.equal(validateAnnotation(annotation).length, 0, `${key} fails the canonical schema`);
      if (annotation.validation?.status === "pending") {
        assert.ok(/^GF[A-O]\d{3}$/.test(pattern.id) || pendingPatternIds.has(pattern.id), `${key}: pending annotation must be explicitly authorised`);
        assert.deepEqual(annotation.spans, [], `${key}: pending record must not fabricate dependency Marks`);
        assert.equal(annotation.validation.needs_rebuild, true);
        assert.equal(annotation.validation.generator, "none");
      } else {
        assert.ok(annotation.spans.length > 0, `${key} has no dependency annotations`);
      }
    }
  }
  assert.equal(Object.keys(items).length, expected);
  assert.ok(overlayPendingCount > 0, "changed C1 source text must be represented as explicit pending annotation records");
});
