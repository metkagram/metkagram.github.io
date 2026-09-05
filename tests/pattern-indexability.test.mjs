import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { evaluatePatternIndexability, INDEXABILITY_POLICY_VERSION } from "../src/indexability-policy.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(DIST, relative), "utf8"));

function decision(policy, patternId) {
  return policy.records.find((record) => record.pattern_id === patternId);
}

function page(locale, patternId) {
  return fs.readFileSync(path.join(DIST, patternPath(locale, patternId).slice(1), "index.html"), "utf8");
}

test("indexability policy publishes one explicit search decision for every Pattern", () => {
  const policy = readJson("data/quality/pattern-indexability.json");
  assert.equal(policy.policy, INDEXABILITY_POLICY_VERSION);
  assert.equal(policy.records.length, policy.summary.patternCount);
  assert.equal(policy.summary.indexablePatternCount + policy.summary.nonIndexablePatternCount, policy.summary.patternCount);
  assert.ok(policy.summary.nonIndexablePatternCount > 0, "editorial gate must make a real search-promotion distinction");
  assert.equal(policy.rules.automatedNearDuplicateCandidatesAffectIndexability, false);
  assert.equal(policy.rules.automatedSlotVariantCandidatesAffectIndexability, false);
});

test("reviewed Frame-family representatives stay indexable while contextual siblings stay available but noindex", () => {
  const policy = readJson("data/quality/pattern-indexability.json");
  const families = [
    ["C1HED001", "C1HED002"],
    ["C1ARG001", "C1ARG002"],
    ["C1PRO001", "C1PRO002"],
  ];
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const inventory = readJson("seo/site-pages.json");

  for (const [representativeId, variantId] of families) {
    const representative = decision(policy, representativeId);
    const variant = decision(policy, variantId);
    assert.equal(representative.indexable, true, `${representativeId} should represent its reviewed Frame family in search`);
    assert.equal(variant.indexable, false, `${variantId} is a reviewed contextual realization, not a separate search concept`);
    assert.ok(variant.reasons.includes("reviewed_contextual_variant"));
    assert.equal(variant.canonical_pattern_id, representativeId);

    for (const locale of ["en", "ru"]) {
      const representativeRoute = patternPath(locale, representativeId);
      const variantRoute = patternPath(locale, variantId);
      const variantHtml = page(locale, variantId);
      assert.match(variantHtml, /<meta name="robots" content="noindex,follow">/);
      assert.match(variantHtml, new RegExp(`<link rel="canonical" href="${SITE_URL}${variantRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`), "stable variant URL remains self-canonical and accessible");
      assert.ok(sitemap.includes(`${SITE_URL}${representativeRoute}`), `${representativeRoute} stays in sitemap`);
      assert.ok(!sitemap.includes(`${SITE_URL}${variantRoute}`), `${variantRoute} must leave sitemap`);
      assert.ok(inventory.pages.some((entry) => entry.route === representativeRoute), `${representativeRoute} stays in SEO inventory`);
      assert.ok(!inventory.pages.some((entry) => entry.route === variantRoute), `${variantRoute} leaves SEO inventory`);
      assert.ok(fs.existsSync(path.join(DIST, variantRoute.slice(1), "index.html")), `${variantRoute} must remain a real page`);
    }
  }
});

test("generated unreviewed Pattern stays usable but is not silently promoted to search", () => {
  const policy = readJson("data/quality/pattern-indexability.json");
  const record = decision(policy, "CON001");
  assert.ok(record, "CON001 policy record must exist");
  assert.equal(record.editorial_status, "generated");
  assert.equal(record.indexable, false);
  assert.ok(record.reasons.includes("unreviewed_editorial_status"));
  assert.match(page("en", "CON001"), /<meta name="robots" content="noindex,follow">/);
  assert.ok(fs.existsSync(path.join(DIST, patternPath("en", "CON001").slice(1), "index.html")), "generated Pattern page remains available to learners and internal navigation");
});

test("final API quality.indexable agrees with the published search-promotion policy", () => {
  const policy = readJson("data/quality/pattern-indexability.json");
  const full = readJson("api/v1/patterns.json");
  const byId = new Map(full.data.map((item) => [item.data.id, item.data]));

  for (const patternId of ["C1HED001", "C1HED002", "CON001", "CLF041"]) {
    const record = decision(policy, patternId);
    const pattern = byId.get(patternId);
    assert.equal(pattern.quality.indexable, record.indexable, `${patternId} full API indexability`);
    assert.equal(pattern.quality.search.policy, INDEXABILITY_POLICY_VERSION);
    assert.deepEqual(pattern.quality.search.reasons, record.reasons);

    const individual = readJson(`api/v1/patterns/${patternId.toLowerCase()}.json`);
    assert.equal(individual.data.quality.indexable, record.indexable, `${patternId} individual API indexability`);
  }
});

test("automated duplicate heuristics alone cannot demote an otherwise curated distinct Pattern", () => {
  const pattern = {
    id: "TEST001",
    set_id: "TEST",
    quality: {
      status: "curated",
      translations_complete: true,
      min_unique_examples: 5,
      has_variation_duplicates: false,
    },
  };
  const record = evaluatePatternIndexability(pattern, { family: null, severeFindings: [] });
  assert.equal(record.indexable, true);
  assert.deepEqual(record.reasons, []);
});

test("high-confidence severe findings and weak content quality are explicit noindex reasons", () => {
  const pattern = {
    id: "TEST002",
    set_id: "TEST",
    quality: {
      status: "curated",
      translations_complete: false,
      min_unique_examples: 2,
      has_variation_duplicates: true,
    },
  };
  const record = evaluatePatternIndexability(pattern, {
    severeFindings: [{ type: "translation_language_mismatch", lang: "en", source: "canonical_translation" }],
  });
  assert.equal(record.indexable, false);
  assert.deepEqual(new Set(record.reasons), new Set([
    "incomplete_translations",
    "insufficient_context_diversity",
    "duplicate_variations",
    "unresolved_high_confidence_quality_finding",
  ]));
});
