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

test("method content cluster contains 48 concepts and 96 localized articles", () => {
  assert.equal(guides.length, METHOD_GUIDE_COUNT);
  assert.equal(guides.length * METHOD_GUIDE_LOCALES.length, 96);
  for (const category of METHOD_GUIDE_CATEGORIES) {
    assert.equal(guides.filter((guide) => guide.category === category).length, 8, `${category} should contain eight guides`);
  }
});

test("annotated reading is a complete bilingual guide direction", () => {
  const annotated = guides.filter((guide) => guide.category === "annotated-reading");
  assert.equal(annotated.length, 8);
  const ids = new Set(annotated.map((guide) => guide.id));
  for (const expected of ["annotated-reading-overview", "annotated-reading-first-pass", "selective-marks", "annotation-to-frame", "fade-the-marks", "annotated-reading-to-speaking", "annotated-reading-advanced", "personal-annotated-reading"]) {
    assert.ok(ids.has(expected), `annotated-reading direction needs ${expected}`);
  }
  for (const guide of annotated) {
    assert.ok(guide.locales.en && guide.locales.ru, `${guide.id} needs EN/RU copy`);
    assert.ok(guide.related.some((id) => ids.has(id)) || guide.related.includes("visual-marks"), `${guide.id} should connect into the annotated-reading graph`);
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
    assert.ok(hub.includes('href="#annotated-reading"'), `${locale} hub needs annotated-reading navigation`);
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
    assert.ok(method.includes("annotated-reading-language-learning"), `${locale}/method must feature annotated reading`);
  }
});

test("machine-readable method guide catalogue mirrors the public cluster", () => {
  const file = path.join(DIST, "data", "method-guides.json");
  assert.ok(fs.existsSync(file));
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(payload.guide_count, 48);
  assert.equal(payload.localized_page_count, 96);
  assert.equal(payload.guides.length, 48);
  assert.equal(payload.guides.filter((guide) => guide.category === "annotated-reading").length, 8);
  assert.match(payload.evidence_boundary, /no efficacy claim/i);
});
