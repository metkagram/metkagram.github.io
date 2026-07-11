import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

test("all source content validates and migrated counts match", () => {
  const content = loadContent();
  assert.deepEqual(contentCounts(content), { annotatedDocuments: 2240, annotatedSentences: 25116, advancedPatterns: 236 });
  assert.equal(content.collections.english.dialogues.documents.length, 111);
  assert.equal(content.collections.english.patterns.documents.length, 353);
  assert.equal(content.collections.english.library.documents.length, 455);
  assert.equal(content.collections.german.dialogues.documents.length, 329);
  assert.equal(content.collections.german.patterns.documents.length, 496);
  assert.equal(content.collections.german.library.documents.length, 496);
});

test("GitHub Pages artifact has root files and localized HTML", () => {
  for (const file of ["index.html", ".nojekyll", "404.html", "sitemap.xml", "robots.txt", "llms.txt", "data/catalog.json"]) {
    assert.ok(fs.existsSync(path.join(DIST, file)), `${file} must exist`);
  }
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  assert.match(en, /<html lang="en">/);
  assert.match(en, /Read the sentence\. Reuse the pattern\./);
  assert.doesNotMatch(en, /Читайте фразу\. Используйте паттерн\./);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /Читайте фразу\. Используйте паттерн\./);
  assert.doesNotMatch(ru, /Read the sentence\. Reuse the pattern\./);
});

test("localized route switch preserves path context", () => {
  const file = path.join(DIST, "en/explore/german/dialogues/index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /href="\/ru\/explore\/german\/dialogues\/" lang="ru"/);
});

test("canonical, hreflang and sitemap use the production Pages origin", () => {
  const file = path.join(DIST, "ru/explore/english/patterns/index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /rel="canonical" href="https:\/\/metkagram\.github\.io\/ru\/explore\/english\/patterns\/"/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="ru"/);
  assert.match(html, /hreflang="x-default"/);
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/practice\/con001\//);
});
