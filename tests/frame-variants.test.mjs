import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { buildDomainModel, frameId } from "../src/domain-model.mjs";
import {
  canonicalFrameId,
  frameVariantId,
  loadFrameFamilies,
  validateFrameFamilies,
} from "../src/frame-families.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function json(...parts) {
  return JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));
}

function routeFile(route) {
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

test("Frame family pilot is explicit, bounded and source-validated", () => {
  const content = loadContent();
  const manifest = validateFrameFamilies(content.advancedPatterns, loadFrameFamilies());
  assert.equal(manifest.families.length, 3);
  assert.deepEqual(manifest.families.map((family) => family.set_id), ["HED", "ARG", "PRO"]);
  const members = manifest.families.flatMap((family) => family.member_pattern_ids);
  assert.equal(new Set(members).size, 24);
  assert.ok(manifest.families.every((family) => family.review.status === "reviewed_pilot"));
  assert.ok(manifest.families.every((family) => family.review.confidence === "high"));
  assert.ok(manifest.families.every((family) => family.review.human_reviewed === false));
});

test("automatic similarity cannot create or alter a canonical family silently", () => {
  const content = loadContent();
  const manifest = structuredClone(loadFrameFamilies());
  manifest.families[0].languages.en.formula = "A structurally different [topic] should fail.";
  assert.throws(
    () => validateFrameFamilies(content.advancedPatterns, manifest),
    /does not match the reviewed abstract Frame signature/,
  );
});

test("one stable Pattern Frame cannot belong to conflicting canonical families", () => {
  const content = loadContent();
  const manifest = structuredClone(loadFrameFamilies());
  const duplicateFamily = structuredClone(manifest.families[0]);
  duplicateFamily.id = "hed-premature-conclusion-conflict";
  manifest.families.push(duplicateFamily);
  assert.throws(
    () => validateFrameFamilies(content.advancedPatterns, manifest),
    /assigned to more than one canonical Frame family/,
  );
});

test("domain model overlays canonical Frames without deleting legacy Pattern Frames", () => {
  const content = loadContent();
  const model = buildDomainModel(content.advancedPatterns, { frameFamilies: loadFrameFamilies() });
  assert.equal(model.patternCount, 3530);
  assert.equal(model.canonicalFrameFamilyCount, 3);
  assert.equal(model.canonicalFrames.length, 6);
  assert.equal(model.frameVariants.length, 48);

  const hedLegacy = model.frames.find((frame) => frame.id === frameId("C1HED002", "en"));
  assert.ok(hedLegacy, "legacy Pattern Frame must remain retrievable");
  assert.equal(hedLegacy.pattern_id, "C1HED002");
  assert.equal(hedLegacy.canonical_frame_id, canonicalFrameId("hed-premature-conclusion", "en"));
  assert.equal(hedLegacy.frame_variant_id, frameVariantId("C1HED002", "en"));

  const standalonePattern = content.advancedPatterns.find((pattern) => !["HED", "ARG", "PRO"].includes(pattern.set_id));
  const standaloneLanguage = standalonePattern?.langs?.[0]?.lang;
  assert.ok(standalonePattern && standaloneLanguage, "expected at least one non-pilot Pattern");
  const standalone = model.frames.find((frame) => frame.id === frameId(standalonePattern.id, standaloneLanguage));
  assert.ok(standalone);
  assert.equal(standalone.canonical_frame_id, standalone.id);
  assert.equal(standalone.frame_variant_id, null);
});

test("published pilot records resolve through data and individual Pattern API", () => {
  const canonicalFrames = json("data", "domain", "canonical-frames.json");
  const variants = json("data", "domain", "frame-variants.json");
  const patternIndex = json("data", "domain", "pattern-index.json");
  assert.equal(canonicalFrames.count, 6);
  assert.equal(variants.count, 48);

  const canonical = canonicalFrames.items.find((item) => item.id === canonicalFrameId("hed-premature-conclusion", "en"));
  assert.ok(canonical);
  assert.equal(canonical.member_pattern_ids.length, 8);
  assert.equal(canonical.representative_pattern_id, "C1HED001");

  const variant = variants.items.find((item) => item.id === frameVariantId("C1HED002", "en"));
  assert.ok(variant);
  assert.equal(variant.pattern_frame_id, frameId("C1HED002", "en"));
  assert.equal(variant.canonical_frame_id, canonical.id);

  const indexRecord = patternIndex.items.find((item) => item.pattern_id === "C1HED002");
  assert.equal(indexRecord.frame_ids.en, frameId("C1HED002", "en"));
  assert.equal(indexRecord.canonical_frame_ids.en, canonical.id);

  const api = json("api", "v1", "patterns", "c1hed002.json");
  assert.equal(api.data.id, "C1HED002");
  assert.equal(api.data.domain_model.frame_ids.en, frameId("C1HED002", "en"));
  assert.equal(api.data.domain_model.canonical_frame_ids.en, canonical.id);
  assert.equal(api.data.domain_model.frame_variant_ids.en, frameVariantId("C1HED002", "en"));
});

test("pilot Pattern pages and canonical URLs remain available in both interface locales", () => {
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  for (const patternId of ["C1HED001", "C1HED002", "C1ARG002", "C1PRO002"]) {
    for (const locale of ["en", "ru"]) {
      const route = patternPath(locale, patternId);
      const file = routeFile(route);
      assert.ok(fs.existsSync(file), `${patternId} lost ${locale} page`);
      const page = fs.readFileSync(file, "utf8");
      assert.match(page, /data-canonical-frame-family=/);
      assert.match(page, new RegExp(patternId, "i"));
      assert.ok(sitemap.includes(`<loc>${SITE_URL}${route}</loc>`), `${patternId} ${locale} route left sitemap`);
    }
  }
});
