import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("research page publishes the annotation system audit", () => {
  const root = process.cwd();
  const html = fs.readFileSync(path.join(root, "dist/en/research/index.html"), "utf8");
  const note = fs.readFileSync(path.join(root, "docs/ANNOTATION_SYSTEM_ANALYSIS.md"), "utf8");

  assert.match(html, /data-annotation-analysis="v1"/);
  assert.match(html, /From visual grammar marks to a research annotation protocol/);
  assert.match(html, /Schema 2\.0 should keep compact surface labels/);
  assert.match(html, /ANNOTATION_SYSTEM_ANALYSIS\.md/);

  assert.match(note, /Proposed Annotation Schema 2\.0 direction/);
  assert.match(note, /Rule 1\. Text is the source of truth/);
  assert.match(note, /R13 · Legacy preservation/);
});
