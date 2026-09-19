import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { cleanMarkedText } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";

test("rewritten pattern examples are explicitly pending until local annotation is rebuilt", () => {
  const content = loadContent();
  const { items, ledger } = loadPracticeAnnotationLayer(content, process.cwd());
  const reasonById = new Map((ledger.patterns || []).map((entry) => [entry.id, entry.reason]));
  const ids = new Set(reasonById.keys());
  const c1Patterns = content.advancedPatterns.filter((pattern) => /^C1[A-Z]+\d+$/.test(pattern.id));

  assert.equal(c1Patterns.length, 20);
  for (const pattern of c1Patterns) assert.ok(ids.has(pattern.id), `${pattern.id}: rewritten C1 pattern must remain in rebuild ledger`);
  for (const id of ["CON002", "QUE005", "PERF006"]) assert.ok(ids.has(id), `${id}: rewritten legacy pattern must be in rebuild ledger`);

  const pendingPatterns = content.advancedPatterns.filter((pattern) => ids.has(pattern.id));
  assert.equal(pendingPatterns.length, ids.size);

  for (const pattern of pendingPatterns) {
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
        assert.equal(record.validation?.reason, reasonById.get(pattern.id));
        assert.deepEqual(record.spans, []);
        assert.equal(
          record.validation?.text_sha256,
          crypto.createHash("sha256").update(record.text, "utf8").digest("hex")
        );
      }
    }
  }
});
