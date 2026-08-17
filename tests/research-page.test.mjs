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
  assert.match(html, /Contextual learning and retention of phrasal verbs/);
  assert.match(html, /Retrieval practice over the long term/);
});

test("Research page exposes an experiment queue tied to product decisions", () => {
  const html = researchHtml();
  for (const id of ["R01", "R02", "R03", "R04", "R05", "R06"]) assert.match(html, new RegExp(id));
  assert.match(html, /Product decision:/);
  assert.match(html, /How evidence can change Metkagram/);
  assert.match(html, /Living research notes/);
});
