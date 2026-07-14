import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.name.endsWith(".html") ? [target] : [];
  });
}

function decodeEntities(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#039;", "'");
}

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
  assert.match(en, /See the structure\. Use the phrase\./);
  assert.doesNotMatch(en, /Понимайте структуру\. Говорите фразами\./);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /Понимайте структуру\. Говорите фразами\./);
  assert.doesNotMatch(ru, /See the structure\. Use the phrase\./);
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

test("every generated page carries the current brand and discoverability metadata", () => {
  const files = htmlFiles(DIST).filter((file) => !file.startsWith(path.join(DIST, "assets")) && !/^google[a-z0-9_-]*\.html$/i.test(path.basename(file)));
  assert.ok(files.length >= 4988, "expected the complete generated page set");
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /<title>[^<]+<\/title>/, `${file} needs a title`);
    assert.match(html, /<meta name="description" content="[^"]+">/, `${file} needs a description`);
    assert.match(html, /rel="canonical" href="https:\/\/metkagram\.github\.io\//, `${file} needs a production canonical`);
    assert.match(html, /assets\/social\/metkagram-social-preview-1200x630\.png/, `${file} needs the branded social preview`);
    assert.match(html, /rel="manifest" href="\/assets\/web\/site\.webmanifest"/, `${file} needs the web manifest`);
    assert.doesNotMatch(html, /assets\/social-preview\.png/, `${file} must not use the legacy social preview`);
    const title = decodeEntities(html.match(/<title>([^<]+)<\/title>/)?.[1] || "");
    const description = decodeEntities(html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "");
    assert.ok(title.length <= 68, `${file} title must stay concise`);
    assert.ok(description.length <= 155, `${file} description must stay concise`);
  }
});
