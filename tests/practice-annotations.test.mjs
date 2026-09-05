import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { EDITORIAL_ANNOTATION_GENERATOR, loadPatternAnnotations, readPracticeAnnotationPayload, resolvePracticeAnnotations } from "../src/practice-annotations.mjs";

const publicOverrides = JSON.parse(fs.readFileSync("data/pattern-annotation-overrides.json", "utf8"));
const publicBase = readPracticeAnnotationPayload();
const fingerprint = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

// Fixtures select already-prepared public records. No annotation generation or
// linguistic heuristics are embedded in the public tests.
function fixture({ setId = "PRO", language = "en", unchanged = false } = {}) {
  const key = Object.keys(publicOverrides.items).find((key) => key.startsWith(`C1${setId}`) && key.endsWith(`:${language}:primary`));
  assert.ok(key);
  const baseRecord = structuredClone(publicBase.items[key]);
  const override = structuredClone(publicOverrides.items[key]);
  const content = { advancedPatterns: [{ id: key.split(":")[0], set_id: setId, langs: [{ lang: language, example: unchanged ? baseRecord.text : override.text, examples: [] }] }] };
  const base = { schema_version: "1.0.0", generator: "local-spacy-dependency", count: 1, items: { [key]: baseRecord } };
  const overrides = { schema_version: "1.0.0", generator: EDITORIAL_ANNOTATION_GENERATOR, set_ids: ["ARG", "PRO"], count: unchanged ? 0 : 1, items: unchanged ? {} : { [key]: override } };
  const integrity = { schemaVersion: 1, count: overrides.count, payload_sha256: fingerprint(overrides) };
  return { key, content, base, overrides, integrity, resolve: (c = content, b = base, o = overrides) => resolvePracticeAnnotations(c, b, o, integrity) };
}

test("the effective Practice annotation layer covers every source sentence and preserves untouched dependency records", () => {
  const content = loadContent();
  const annotations = loadPatternAnnotations(content);
  let expected = 0, preserved = 0;
  for (const pattern of content.advancedPatterns) for (const language of pattern.langs) {
    const references = [{ key: "primary", text: language.example }, ...(language.examples || []).map((example, index) => ({ key: String(index + 1), text: example.text }))];
    for (const reference of references) {
      expected += 1;
      const key = `${pattern.id}:${language.lang}:${reference.key}`;
      const annotation = annotations[key];
      assert.ok(annotation, `missing ${key}`);
      assert.equal(annotation.text, cleanMarkedText(reference.text), `${key} text changed`);
      assert.equal(annotation.inline_text, cleanMarkedText(reference.text));
      assert.deepEqual(validateAnnotation(annotation), [], `${key} fails the canonical schema`);
      assert.ok(annotation.spans.length > 0);
      if (!Object.hasOwn(publicOverrides.items, key)) {
        preserved += 1;
        assert.deepEqual(annotation, publicBase.items[key], `${key} dependency record changed`);
      } else {
        assert.ok(["PRO", "ARG"].includes(pattern.set_id));
        assert.equal(annotation.validation.generator, EDITORIAL_ANNOTATION_GENERATOR);
        assert.equal(annotation.validation.coverage, "fixed-frame-only");
        assert.equal(annotation.validation.dependency_parse, false);
        assert.equal(annotation.validation.spacy_loaded, undefined);
      }
    }
  }
  assert.ok(preserved > 0);
  assert.equal(publicBase.count, expected);
  assert.equal(Object.keys(annotations).length, expected);
  const integrity = JSON.parse(fs.readFileSync("data/pattern-annotation-integrity.json", "utf8"));
  assert.equal(integrity.payload_sha256, fingerprint(publicOverrides));
});

test("changed text fails closed without a prepared override and unchanged records retain identity", () => {
  const f = fixture();
  assert.throws(() => resolvePracticeAnnotations(f.content, f.base), /text mismatch/);
  const unchanged = fixture({ unchanged: true });
  assert.equal(unchanged.resolve()[unchanged.key], unchanged.base.items[unchanged.key]);
  assert.throws(() => resolvePracticeAnnotations(f.content, f.base, f.overrides), /integrity mismatch/);
});

test("prepared PRO and ARG annotations expose precise fixed-token spans with partial provenance", () => {
  for (const [setId, language, tags] of [
    ["PRO", "en", ["I", "am", "writing", "to", "clarify how", "affect", "steps"]],
    ["PRO", "de", ["Ich", "schreibe", "um zu erläutern, wie", "Schritte", "beeinflusst"]],
    ["ARG", "en", ["case", "for", "rests", "on the assumption that"]],
    ["ARG", "de", ["Argument", "für", "beruht", "auf der Annahme, dass"]]
  ]) {
    const f = fixture({ setId, language });
    const record = f.resolve()[f.key];
    assert.deepEqual(record.spans.map((span) => record.text.slice(span.start, span.end)), tags);
    assert.equal(record.validation.dependency_parse, false);
  }
});

test("stale source text and stale cache records invalidate prepared overrides", () => {
  const f = fixture();
  const next = structuredClone(f.content);
  next.advancedPatterns[0].langs[0].example = "I am writing to clarify how new findings affect the next steps.";
  assert.throws(() => f.resolve(next), /text mismatch/);
  const changedBase = structuredClone(f.base);
  changedBase.items[f.key].id = "different-service-run";
  assert.throws(() => f.resolve(f.content, changedBase), /Stale editorial/);
  const refreshedBase = structuredClone(f.base);
  refreshedBase.items[f.key].text = f.overrides.items[f.key].text;
  refreshedBase.items[f.key].inline_text = f.overrides.items[f.key].text;
  assert.throws(() => f.resolve(f.content, refreshedBase), /Unnecessary editorial override/);
});

test("malformed roles, in-bounds wrong offsets and false parser provenance cannot change a prepared export", () => {
  const f = fixture(), key = f.key;
  for (const mutate of [
    (v) => { v.items[key] = null; },
    (v) => { v.items[key].id = "wrong-id"; },
    (v) => { v.items[key].source.pattern_example_id = "wrong-source"; },
    (v) => { v.items[key].language = "de"; },
    (v) => { v.items[key].spans = null; },
    (v) => { v.items[key].spans[0].start = 1; v.items[key].spans[0].end = 2; },
    (v) => { v.items[key].spans[0].role = "object"; },
    (v) => { v.items[key].validation.spacy_loaded = true; },
    (v) => { v.items[key].provenance.source_text_sha256 = "0".repeat(64); },
    (v) => { v.generator = "local-spacy-dependency"; },
    (v) => { v.count += 1; },
    (v) => { v.set_ids.push("HED"); }
  ]) {
    const value = structuredClone(f.overrides);
    mutate(value);
    assert.throws(() => f.resolve(f.content, f.base, value));
  }
});

test("unknown annotation IDs and missing baseline records fail before publication", () => {
  const f = fixture();
  const unknown = structuredClone(f.overrides);
  unknown.items["C1PRO999:en:primary"] = unknown.items[f.key];
  delete unknown.items[f.key];
  assert.throws(() => f.resolve(f.content, f.base, unknown), /Unknown editorial annotation/);
  const missing = structuredClone(f.base);
  delete missing.items[f.key];
  missing.count = 0;
  assert.throws(() => f.resolve(f.content, missing), /Unknown editorial annotation/);
});

test("baseline source metadata, spans and unexpected keys remain strictly validated", () => {
  const f = fixture({ unchanged: true });
  for (const mutate of [
    (d) => { d.items[f.key].source.pattern_example_id = "wrong-source"; },
    (d) => { d.items[f.key].spans[0].end = 900; },
    (d) => { d.items[f.key].inline_text = "wrong text"; },
    (d) => { d.items.extra = d.items[f.key]; d.count += 1; },
    (d) => { d.count += 1; },
    (d) => { d.generator = "unverified-generator"; }
  ]) {
    const data = structuredClone(f.base);
    mutate(data);
    assert.throws(() => f.resolve(f.content, data));
  }
});
