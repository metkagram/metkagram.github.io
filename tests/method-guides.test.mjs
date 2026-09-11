import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  METHOD_GUIDE_CATEGORIES,
  METHOD_GUIDE_COUNT,
  METHOD_GUIDE_LOCALES,
  loadMethodGuides,
} from "../src/method-guides.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const { guides, sources } = loadMethodGuides();

function route(locale, guide) {
  return `/${locale}/method/guides/${guide.slug}/`;
}

function renderedFile(pathname) {
  return path.join(DIST, pathname.replace(/^\//, ""), "index.html");
}

test("method content cluster contains 40 concepts and 80 localized articles", () => {
  assert.equal(guides.length, METHOD_GUIDE_COUNT);
  assert.equal(guides.length * METHOD_GUIDE_LOCALES.length, 80);
  for (const category of METHOD_GUIDE_CATEGORIES) {
    assert.equal(guides.filter((guide) => guide.category === category).length, 8, `${category} should contain eight guides`);
  }
});

test("every method guide has inspectable research provenance", () => {
  const sourceIds = new Set(sources.map((source) => source.id));
  assert.ok(sources.length >= 10);
  for (const source of sources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.authors && source.title && source.year);
  }
  for (const guide of guides) {
    assert.ok(guide.source_ids.length >= 1);
    for (const sourceId of guide.source_ids) assert.ok(sourceIds.has(sourceId), `${guide.id} references ${sourceId}`);
  }
});

test("rendered method hubs discover every localized article", () => {
  for (const locale of METHOD_GUIDE_LOCALES) {
    const hubFile = renderedFile(`/${locale}/method/guides/`);
    assert.ok(fs.existsSync(hubFile), `${locale} method guide hub must render`);
    const hub = fs.readFileSync(hubFile, "utf8");
    for (const guide of guides) {
      const pathname = route(locale, guide);
      assert.ok(hub.includes(`href="${pathname}"`), `${locale} hub must link ${guide.id}`);
      const file = renderedFile(pathname);
      assert.ok(fs.existsSync(file), `${pathname} must render`);
      const html = fs.readFileSync(file, "utf8");
      assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${pathname}">`), `${pathname} needs canonical`);
      const alternateLocale = locale === "en" ? "ru" : "en";
      const alternate = `${SITE_URL}/${alternateLocale}/method/guides/${guide.slug}/`;
      assert.ok(html.includes(`href="${alternate}"`), `${pathname} needs alternate locale link`);
      assert.ok(html.includes("Evidence boundary") || html.includes("Граница доказательности"), `${pathname} needs explicit evidence boundary`);
    }
    const method = fs.readFileSync(renderedFile(`/${locale}/method/`), "utf8");
    assert.ok(method.includes('id="method-guide-cluster"'), `${locale}/method must expose the guide cluster`);
  }
});

test("machine-readable method guide catalogue mirrors the public cluster", () => {
  const file = path.join(DIST, "data", "method-guides.json");
  assert.ok(fs.existsSync(file));
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(payload.guide_count, 40);
  assert.equal(payload.localized_page_count, 80);
  assert.equal(payload.guides.length, 40);
  assert.match(payload.evidence_boundary, /no efficacy claim/i);
});
