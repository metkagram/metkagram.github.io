import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("research page explains the inline annotation mechanism and evaluation", () => {
  const root = process.cwd();
  const html = fs.readFileSync(path.join(root, "dist/en/research/index.html"), "utf8");
  const note = fs.readFileSync(path.join(root, "docs/ANNOTATION_SYSTEM_ANALYSIS.md"), "utf8");

  assert.match(html, /data-annotation-analysis="v2"/);
  assert.match(html, /What happens when the learner sees the structure inside the sentence\?/);
  assert.match(html, /Remove the cue and ask for production/);
  assert.match(html, /Plain sentence/);
  assert.match(html, /Inline annotation/);
  assert.match(html, /Separate explanation/);
  assert.match(html, /Transfer: can the learner use the same structure in a new, unannotated sentence\?/);
  assert.match(html, /ANNOTATION_SYSTEM_ANALYSIS\.md/);

  assert.match(note, /Proposed Annotation Schema 2\.0 direction/);
  assert.match(note, /Rule 1\. Text is the source of truth/);
  assert.match(note, /R15 · Minimal learner view/);
});
