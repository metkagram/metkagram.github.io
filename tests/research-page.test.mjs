import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const researchFile = path.join(process.cwd(), "dist", "en", "research", "index.html");

function researchHtml() {
  assert.ok(fs.existsSync(researchFile), "build must generate /en/research/");
  return fs.readFileSync(researchFile, "utf8");
}

test("Research page publishes evidence notes with explicit limits", () => {
  const html = researchHtml();
  assert.match(html, /What outside research tells us/);
  assert.match(html, /They do not prove that the Metkagram interface works better/);
  assert.match(html, /Lee &amp; Huang|Lee & Huang/);
  assert.match(html, /Morphological salience|morphological salience/i);
  assert.match(html, /Chunking multi-word expressions|larger patterns from smaller chunks/i);
  assert.match(html, /Three-stage model|Practice may need to change/i);
  assert.match(html, /Visual notation needs a non-visual path/);
});

test("Research page exposes an expanded experiment queue tied to product decisions", () => {
  const html = researchHtml();
  for (const id of ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10", "R11", "R12"]) {
    assert.match(html, new RegExp(id));
  }
  assert.match(html, /Product decision:/);
  assert.match(html, /How evidence can change Metkagram/);
  assert.match(html, /Living research notes/);
});

test("Research page defines measurement rules", () => {
  const html = researchHtml();
  assert.match(html, /How we should know if an idea works/);
  assert.match(html, /Measure transfer, not only memory/);
  assert.match(html, /web-based elicited imitation/i);
  assert.match(html, /comprehension as a guardrail/i);
});
