import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const NEW_SET_IDS = ["FRM", "UNC", "SYS", "DEC"];
const ESTABLISHED_SET_IDS = ["ARG", "OPI", "EVD", "CGR", "SPK", "INT", "REG", "RTR", "TRN"];

test("Thinking in Language extends the curriculum without replacing established sets", () => {
  const content = loadContent();
  const setIds = new Set(content.studySets.sets.map((set) => set.id));

  for (const id of ESTABLISHED_SET_IDS) assert.ok(setIds.has(id), `established set ${id} must remain public`);
  for (const id of NEW_SET_IDS) assert.ok(setIds.has(id), `thinking set ${id} must be public`);

  const thinkingPatterns = content.advancedPatterns.filter((pattern) => NEW_SET_IDS.includes(pattern.set_id));
  assert.equal(thinkingPatterns.length, 20);
  for (const setId of NEW_SET_IDS) {
    const patterns = thinkingPatterns.filter((pattern) => pattern.set_id === setId);
    assert.equal(patterns.length, 5, `${setId} should start with five curated patterns`);
    assert.ok(patterns.every((pattern) => pattern.reasoning?.move));
    assert.ok(patterns.every((pattern) => pattern.quality?.indexable));
    assert.ok(patterns.every((pattern) => pattern.langs.length === 2));
    assert.ok(patterns.every((pattern) => pattern.langs.every((lang) => lang.translation && lang.examples.length >= 2)));
  }
});

test("Thinking in Language manifest and Pattern Atlas topic stay discoverable", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "thinking-extension-manifest.json"), "utf8"));
  assert.deepEqual(manifest.setIds, NEW_SET_IDS);
  assert.equal(manifest.patternCount, 20);

  for (const locale of ["en", "ru"]) {
    const route = path.join(DIST, locale, "patterns", "thinking-framing-uncertainty-and-decisions", "index.html");
    assert.ok(fs.existsSync(route), `${locale} thinking Pattern Atlas route must exist`);
    const html = fs.readFileSync(route, "utf8");
    assert.match(html, /FRM|Problem framing|Постановка/);
    assert.match(html, /UNC|uncertainty|неопредел/iu);
    assert.match(html, /SYS|systems|систем/iu);
    assert.match(html, /DEC|decision|решен/iu);
  }

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /\/en\/patterns\/thinking-framing-uncertainty-and-decisions\//);
  assert.match(sitemap, /\/ru\/patterns\/thinking-framing-uncertainty-and-decisions\//);
});
