import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { cleanMarkedText } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";

test("rewritten C1 examples are explicitly pending until local annotation is rebuilt", () => {
  const content = loadContent();
  const { items, ledger } = loadPracticeAnnotationLayer(content, process.cwd());
  const ids = new Set((ledger.patterns || []).map((entry) => entry.id));
  const c1Patterns = content.advancedPatterns.filter((pattern) => /^C1[A-Z]+\d+$/.test(pattern.id));

  assert.equal(ids.size, 20);
  assert.equal(c1Patterns.length, 20);
  assert.deepEqual(new Set(c1Patterns.map((pattern) => pattern.id)), ids);

  for (const pattern of c1Patterns) {
    for (const language of pattern.langs || []) {
      const references = [
        { key: "primary", text: language.example },
        ...(language.examples || []).map((example, index) => ({ key: String(index + 1), text: example.text }))
      ];
      for (const reference of references) {
        const key = `${pattern.id}:${language.lang}:${reference.key}`;
        const record = items[key];
        assert.ok(record, `${key}: missing annotation record`);
        assert.equal(record.text, cleanMarkedText(reference.text));
        assert.equal(record.inline_text, cleanMarkedText(reference.text));
        assert.equal(record.validation?.status, "pending");
        assert.equal(record.validation?.needs_rebuild, true);
        assert.equal(record.validation?.generator, "none");
        assert.equal(record.validation?.reason, "source_text_changed_requires_local_annotation_rebuild");
        assert.deepEqual(record.spans, []);
        assert.equal(
          record.validation?.text_sha256,
          crypto.createHash("sha256").update(record.text, "utf8").digest("hex")
        );
      }
    }
  }
});
