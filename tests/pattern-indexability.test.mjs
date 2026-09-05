import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { loadFrameFamilies } from "../src/frame-families.mjs";
import { buildPatternIndexability } from "../src/pattern-indexability.mjs";
import { legacyPatternPath, patternPath, patternUrl } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function routeFile(route) {
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

function currentReport() {
  return buildPatternIndexability(loadContent(), { frameFamilies: loadFrameFamilies() });
}

function decision(report, patternId) {
  return report.items.find((item) => item.pattern_id === patternId);
}

test("editorial indexability covers the complete Pattern corpus and is non-destructive", () => {
  const content = loadContent();
  const report = currentReport();
  assert.equal(report.counts.total, content.advancedPatterns.length);
  assert.equal(report.items.length, content.advancedPatterns.length);
  assert.equal(report.counts.indexable + report.counts.noindex, report.counts.total);
  assert.ok(report.invariants.some((value) => /never deindexes/i.test(value)));
  assert.ok(report.invariants.some((value) => /never deletes/i.test(value)));
});

test("explicit canonical Frame representatives stay searchable while contextual variants become noindex", () => {
  const report = currentReport();
  const representative = decision(report, "C1HED001");
  const variant = decision(report, "C1HED002");
  assert.equal(representative.indexable, true);
  assert.equal(representative.reason, "canonical_frame_representative");
  assert.equal(variant.indexable, false);
  assert.equal(variant.robots, "noindex,follow");
  assert.equal(variant.reason, "canonical_frame_contextual_variant");
  assert.equal(variant.representative_pattern_id, "C1HED001");
});

test("automated similarity alone cannot deindex an otherwise reviewed standalone Pattern", () => {
  const content = loadContent();
  const pattern = structuredClone(content.advancedPatterns.find((item) => item.id === "GRMADJ001"));
  assert.ok(pattern);
  pattern.quality = { ...(pattern.quality || {}), indexable: true, status: "curated" };
  const report = buildPatternIndexability({ advancedPatterns: [pattern] }, {
    frameFamilies: { families: [] },
    audit: {
      linguisticIssues: [],
      duplicateGroups: { exact: [], slotVariants: [{ pattern_ids: [pattern.id] }], nearPairs: [] },
    },
  });
  assert.equal(report.items[0].indexable, true);
  assert.equal(report.items[0].reason, "reviewed_standalone_pattern");
  assert.equal(report.items[0].automated_similarity_used_as_decision, false);
});

test("generated or unreviewed content cannot silently become indexable", () => {
  const pattern = {
    id: "TESTGEN001",
    set_id: "TEST",
    quality: { indexable: true, status: "generated" },
    gen: { status: "generated" },
  };
  const report = buildPatternIndexability({ advancedPatterns: [pattern] }, {
    frameFamilies: { families: [] },
    audit: { linguisticIssues: [] },
  });
  assert.equal(report.items[0].indexable, false);
  assert.equal(report.items[0].reason, "editorial_review_gate");
});

test("high-severity high-confidence audit findings block standalone search promotion", () => {
  const pattern = {
    id: "TESTQA001",
    set_id: "TEST",
    quality: { indexable: true, status: "curated" },
    gen: { status: "curated" },
  };
  const report = buildPatternIndexability({ advancedPatterns: [pattern] }, {
    frameFamilies: { families: [] },
    audit: {
      linguisticIssues: [{
        pattern_id: pattern.id,
        type: "translation_language_mismatch",
        lang: "de",
        source: "canonical_translation",
        severity: "high",
        confidence: "high",
      }],
    },
  });
  assert.equal(report.items[0].indexable, false);
  assert.equal(report.items[0].reason, "unresolved_high_confidence_quality_finding");
});

test("published noindex Pattern pages remain valid self-canonical routes but leave sitemap and SEO inventory", () => {
  const content = loadContent();
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality", "pattern-indexability.json"), "utf8"));
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));
  const inventoryRoutes = new Set(inventory.pages.map((page) => page.route));
  const byId = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  const variant = report.items.find((item) => item.pattern_id === "C1HED002");
  assert.equal(variant.indexable, false);

  for (const locale of ["en", "ru"]) {
    const pattern = byId.get(variant.pattern_id);
    const route = patternPath(locale, pattern);
    const file = routeFile(route);
    assert.ok(fs.existsSync(file), `noindex route must remain available: ${route}`);
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.ok(html.includes(`<link rel="canonical" href="${patternUrl(locale, pattern)}">`), "noindex page keeps its stable self-canonical URL");
    assert.equal(sitemap.includes(`<loc>${patternUrl(locale, pattern)}</loc>`), false);
    assert.equal(inventoryRoutes.has(route), false);

    const legacyRoute = legacyPatternPath(locale, pattern);
    assert.ok(fs.existsSync(routeFile(legacyRoute)), `legacy compatibility route must remain: ${legacyRoute}`);
  }
});

test("representative canonical Frame Pattern remains indexable in both locales", () => {
  const content = loadContent();
  const pattern = content.advancedPatterns.find((item) => item.id === "C1HED001");
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));
  const inventoryRoutes = new Set(inventory.pages.map((page) => page.route));

  for (const locale of ["en", "ru"]) {
    const route = patternPath(locale, pattern);
    const html = fs.readFileSync(routeFile(route), "utf8");
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/);
    assert.ok(sitemap.includes(`<loc>${patternUrl(locale, pattern)}</loc>`));
    assert.ok(inventoryRoutes.has(route));
  }
});

test("individual Pattern API records expose the same search-indexability reason", () => {
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality", "pattern-indexability.json"), "utf8"));
  for (const patternId of ["C1HED001", "C1HED002", "C1ARG002", "C1PRO002"]) {
    const expected = report.items.find((item) => item.pattern_id === patternId);
    const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "patterns", `${patternId.toLowerCase()}.json`), "utf8"));
    assert.equal(api.data.search_indexability.indexable, expected.indexable);
    assert.equal(api.data.search_indexability.reason, expected.reason);
    assert.equal(api.data.search_indexability.canonical_frame_role, expected.canonical_frame_role);
  }
});
