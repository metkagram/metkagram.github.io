import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));

test("shareable Pattern Card manifest contains 50 indexable bilingual Patterns and 100 cards", () => {
  const manifest = readJson("dist/cards/manifest.json");
  const indexability = readJson("dist/data/quality/pattern-indexability.json");
  const indexable = new Set(indexability.records.filter((record) => record.indexable).map((record) => record.pattern_id));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.patternCount, 50);
  assert.equal(manifest.cardCount, 100);
  assert.deepEqual(manifest.languages, ["en", "de"]);
  assert.match(manifest.generatedFrom, /reviewed-indexable.*annotations/i);

  const byPattern = new Map();
  for (const card of manifest.cards) {
    assert.ok(indexable.has(card.pattern_id), `${card.pattern_id} must stay indexable`);
    assert.ok(["en", "de"].includes(card.language));
    assert.ok(card.annotation_span_count > 0, `${card.pattern_id}:${card.language} needs annotation Marks`);
    const languages = byPattern.get(card.pattern_id) || new Set();
    languages.add(card.language);
    byPattern.set(card.pattern_id, languages);
  }
  assert.equal(byPattern.size, 50);
  for (const [patternId, languages] of byPattern) {
    assert.deepEqual(languages, new Set(["en", "de"]), `${patternId} must have EN and DE cards`);
  }
});

test("generated card pages are screenshot/print ready, attributed, and canonicalize to the learning record", () => {
  const manifest = readJson("dist/cards/manifest.json");
  const seenMarkTypes = new Set();

  for (const card of manifest.cards) {
    const html = read(`dist${card.url}index.html`);
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.ok(html.includes(`<link rel="canonical" href="${card.canonical_url}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${card.canonical_url}">`));
    assert.match(html, /<meta name="metkagram-rights" content="source-available-not-open-source">/);
    assert.match(html, /assets\/social\/metkagram-social-preview-1200x630\.png/);
    assert.match(html, /rel="manifest" href="\/assets\/web\/site\.webmanifest"/);
    assert.ok(html.includes(`data-pattern-card="${card.pattern_id}"`));
    assert.ok(html.includes(`data-learning-language="${card.language}"`));
    assert.match(html, /Source-available terms/);
    assert.match(html, /aspect-ratio:16\/9/);
    assert.match(html, /@media print/);
    assert.match(html, /data-mark-type="[^"]+"/);
    for (const match of html.matchAll(/data-mark-type="([^"]+)"/g)) seenMarkTypes.add(match[1]);
  }

  assert.ok(seenMarkTypes.size >= 2, `expected representative annotation diversity, found ${[...seenMarkTypes].join(", ")}`);
});

test("card gallery is non-indexable and card routes never enter the sitemap", () => {
  const gallery = read("dist/cards/index.html");
  const sitemap = read("dist/sitemap.xml");
  const manifest = readJson("dist/cards/manifest.json");

  assert.match(gallery, /<meta name="robots" content="noindex,follow">/);
  assert.match(gallery, /<meta name="metkagram-rights" content="source-available-not-open-source">/);
  assert.doesNotMatch(sitemap, /https:\/\/metkagram\.github\.io\/cards\//);
  for (const card of manifest.cards.slice(0, 10)) assert.ok(gallery.includes(card.url));
});
