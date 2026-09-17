import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { canonicalPracticePatterns, loadPatternAliases, patternAliasEntries, validatePatternAliases } from "../src/pattern-aliases.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function routeFile(route) {
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(DIST, relative), "utf8"));
}

test("structural Pattern aliases collapse repeated contextual realizations", () => {
  const content = loadContent();
  const manifest = validatePatternAliases(content.advancedPatterns, loadPatternAliases());
  const canonical = canonicalPracticePatterns(content.advancedPatterns, manifest);
  const aliases = patternAliasEntries(manifest);

  assert.equal(content.advancedPatterns.length, 3530);
  assert.equal(manifest.groups.length, 300);
  assert.equal(aliases.length, 2900);
  assert.equal(canonical.length, 630);
  assert.equal(new Set(aliases.map((entry) => entry.alias_id)).size, aliases.length);
  assert.ok(!canonical.some((pattern) => pattern.id === "C1AGR002"));
  assert.ok(canonical.some((pattern) => pattern.id === "C1AGR001"));

  const agr = manifest.groups.find((group) => group.canonical_id === "C1AGR001");
  assert.ok(agr);
  assert.equal(agr.alias_ids.length, 39);
  assert.ok(agr.alias_ids.includes("C1AGR002"));
});

test("published Pattern dataset contains only canonical reusable frames", () => {
  const published = readJson("data/advanced-patterns.json");
  const manifest = readJson("data/pattern-aliases.json");
  const aliasIds = new Set(patternAliasEntries(manifest).map((entry) => entry.alias_id));
  assert.equal(published.length, manifest.canonicalPatternCount);
  assert.equal(published.length, 630);
  assert.ok(published.every((pattern) => !aliasIds.has(pattern.id)));
});

test("retired contextual Pattern URLs redirect to their canonical reusable frame", () => {
  const manifest = loadPatternAliases();
  const content = loadContent();
  const canonicalById = new Map(canonicalPracticePatterns(content.advancedPatterns, manifest).map((pattern) => [pattern.id, pattern]));

  for (const alias of patternAliasEntries(manifest)) {
    const canonical = canonicalById.get(alias.canonical_id);
    assert.ok(canonical, `missing canonical Pattern ${alias.canonical_id}`);
    for (const locale of ["en", "ru"]) {
      const aliasRoute = patternPath(locale, alias.alias_id);
      const destination = patternPath(locale, canonical);
      const file = routeFile(aliasRoute);
      assert.ok(fs.existsSync(file), `missing redirect page for ${alias.alias_id}/${locale}`);
      if (alias.alias_id === "C1AGR002") {
        const html = fs.readFileSync(file, "utf8");
        assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${destination}">`));
        assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${destination}">`));
      }
    }
  }
});

test("sitemap indexes canonical Pattern pages but not structural aliases", () => {
  const content = loadContent();
  const manifest = loadPatternAliases();
  const canonicalById = new Map(canonicalPracticePatterns(content.advancedPatterns, manifest).map((pattern) => [pattern.id, pattern]));
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const agrCanonical = canonicalById.get("C1AGR001");
  assert.ok(agrCanonical);
  assert.ok(sitemap.includes(`${SITE_URL}${patternPath("ru", agrCanonical)}`));
  assert.ok(!sitemap.includes(`${SITE_URL}${patternPath("ru", "C1AGR002")}`));
});
