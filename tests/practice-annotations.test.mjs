import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import { cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();

test("the Practice annotation layer covers every original source sentence without changing it", () => {
  const file = path.join(ROOT, "data", "pattern-annotations.json.gz");
  const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
  assert.equal(payload.schema_version, "1.0.0");
  if (payload.generator === "mixed-local-annotations-and-explicit-pending-records") {
    assert.equal(payload.previous_generator, "local-spacy-dependency");
  } else {
    assert.equal(payload.generator, "local-spacy-dependency");
  }

  let expected = 0;
  for (const pattern of loadContent().advancedPatterns) for (const language of pattern.langs) {
    const references = [{ key: "primary", text: language.example }, ...(language.examples || []).map((example, index) => ({ key: String(index + 1), text: example.text }))];
    for (const reference of references) {
      expected += 1;
      const key = `${pattern.id}:${language.lang}:${reference.key}`;
      const annotation = payload.items[key];
      assert.ok(annotation, `missing ${key}`);
      assert.equal(annotation.text, cleanMarkedText(reference.text), `${key} text changed`);
      assert.equal(annotation.inline_text, cleanMarkedText(reference.text), `${key} inline text changed`);
      assert.equal(validateAnnotation(annotation).length, 0, `${key} fails the canonical schema`);
      if (annotation.validation?.status === "pending") {
        assert.ok(/^GF[A-O]\d{3}$/.test(pattern.id), `${key}: established annotations cannot silently become pending`);
        assert.deepEqual(annotation.spans, [], `${key}: pending record must not fabricate dependency Marks`);
        assert.equal(annotation.validation.needs_rebuild, true);
        assert.equal(annotation.validation.generator, "none");
      } else {
        assert.ok(annotation.spans.length > 0, `${key} has no dependency annotations`);
      }
    }
  }
  assert.equal(payload.count, expected);
  assert.equal(Object.keys(payload.items).length, expected);
});
