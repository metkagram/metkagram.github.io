import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { legacyPatternPath, patternPath, patternSlug, patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const content = loadContent();
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "seo-slugs.json"), "utf8"));
const sitemapUrls = new Set([...fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));
const inventoryRoutes = new Set(inventory.pages.map((page) => page.route));
const indexability = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality", "pattern-indexability.json"), "utf8"));
const decisions = new Map(indexability.records.map((record) => [record.pattern_id, record]));

const pageFile = (route) => path.join(DIST, route.slice(1), "index.html");

test("frozen SEO registry covers every topic set and every pattern", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.deepEqual(new Set(Object.keys(registry.studySets)), new Set(content.studySets.sets.map((set) => set.id)));
  assert.deepEqual(new Set(Object.keys(registry.patterns)), new Set(content.advancedPatterns.map((pattern) => pattern.id)));

  const slugs = content.advancedPatterns.map(patternSlug);
  assert.equal(new Set(slugs).size, content.advancedPatterns.length);
  for (const pattern of content.advancedPatterns) {
    const core = registry.patterns[pattern.id];
    const slug = patternSlug(pattern);
    assert.match(core, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(slug.endsWith(`-${pattern.id.toLowerCase()}`));
    assert.ok(slug.length <= 64, `${pattern.id} slug is too long: ${slug}`);
  }
});

test("all localized Pattern canonicals exist while sitemap and SEO inventory follow editorial indexability", () => {
  for (const locale of ["en", "ru"]) for (const pattern of content.advancedPatterns) {
    const route = patternPath(locale, pattern);
    const decision = decisions.get(pattern.id);
    assert.ok(decision, `missing indexability decision for ${pattern.id}`);
    assert.ok(fs.existsSync(pageFile(route)), `missing canonical Pattern page ${route}`);
    assert.equal(inventoryRoutes.has(route), decision.indexable, `SEO inventory drift for ${route}`);
    assert.equal(sitemapUrls.has(patternUrl(locale, pattern)), decision.indexable, `sitemap drift for ${route}`);
    const html = fs.readFileSync(pageFile(route), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${patternUrl(locale, pattern)}">`), `${route} must remain self-canonical`);
    assert.match(html, decision.indexable ? /<meta name="robots" content="index,follow/ : /<meta name="robots" content="noindex,follow">/);
  }
});

test("every legacy pattern ID route immediately points to its descriptive canonical", () => {
  for (const locale of ["en", "ru"]) for (const pattern of content.advancedPatterns) {
    const legacy = legacyPatternPath(locale, pattern);
    const canonicalPath = patternPath(locale, pattern);
    const canonicalUrl = patternUrl(locale, pattern);
    const html = fs.readFileSync(pageFile(legacy), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${canonicalUrl}">`), `${legacy} canonical mismatch`);
    assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${canonicalPath}">`), `${legacy} redirect mismatch`);
    assert.ok(html.includes(`<a href="${canonicalPath}">`), `${legacy} fallback link mismatch`);
    assert.equal(sitemapUrls.has(`https://metkagram.github.io${legacy}`), false, `${legacy} must not be in sitemap`);
    assert.equal(inventoryRoutes.has(legacy), false, `${legacy} must not be in SEO inventory`);
  }
});

test("representative pattern pages expose self-canonical and bilingual alternates", () => {
  const samples = [
    content.advancedPatterns.find((pattern) => decisions.get(pattern.id)?.indexable),
    [...content.advancedPatterns].reverse().find((pattern) => decisions.get(pattern.id)?.indexable),
    content.advancedPatterns.find((pattern) => pattern.id === "CLF041"),
  ].filter(Boolean);
  for (const pattern of samples) for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(pageFile(patternPath(locale, pattern)), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${patternUrl(locale, pattern)}">`));
    assert.ok(html.includes(`hreflang="en" href="${patternUrl("en", pattern)}"`));
    assert.ok(html.includes(`hreflang="ru" href="${patternUrl("ru", pattern)}"`));
    assert.match(html, /"@type":"LearningResource"/);
  }
});
