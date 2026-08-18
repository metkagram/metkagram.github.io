import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("research page explains the inline annotation mechanism, interpretation and evaluation", () => {
  const root = process.cwd();
  const html = fs.readFileSync(path.join(root, "dist/en/research/index.html"), "utf8");
  const note = fs.readFileSync(path.join(root, "docs/ANNOTATION_SYSTEM_ANALYSIS.md"), "utf8");

  assert.match(html, /data-annotation-analysis="v3"/);
  assert.match(html, /What happens when the learner sees the structure inside the sentence\?/);
  assert.match(html, /The strongest idea is point-of-processing support/);
  assert.match(html, /Repeated tags can compress many examples into one visual grammar/);
  assert.match(html, /The real target is a relation, not a label/);
  assert.match(html, /Fading is part of the method, not an optional exercise/);
  assert.match(html, /How inline annotation could fail/);
  assert.match(html, /Attention capture/);
  assert.match(html, /Cue dependency/);
  assert.match(html, /Plain sentence/);
  assert.match(html, /Inline annotation/);
  assert.match(html, /Separate explanation/);
  assert.match(html, /Transfer: can the learner use the same structure in a new, unannotated sentence\?/);
  assert.match(html, /ANNOTATION_SYSTEM_ANALYSIS\.md/);

  assert.match(note, /Proposed Annotation Schema 2\.0 direction/);
  assert.match(note, /Rule 1\. Text is the source of truth/);
  assert.match(note, /R15 · Minimal learner view/);
});
