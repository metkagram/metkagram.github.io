import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { legacyStudySetPath, studySetPath, studySetSlug } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const content = loadContent();
const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");

const page = (route) => fs.readFileSync(path.join(DIST, route.slice(1), "index.html"), "utf8");
const meta = (html, pattern) => html.match(pattern)?.[1] || "";

test("study-set slugs are readable, stable and unique", () => {
  const slugs = content.studySets.sets.map(studySetSlug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(slug.length >= 3 && slug.length <= 80);
  }
});

test("localized study-set landing pages ship complete search metadata", () => {
  for (const locale of ["en", "ru"]) for (const set of content.studySets.sets) {
    const route = studySetPath(locale, set);
    const html = page(route);
    const title = meta(html, /<title>([^<]+)<\/title>/);
    const description = meta(html, /<meta name="description" content="([^"]+)">/);
    assert.ok(title.length >= 20 && title.length <= 70, `${route} title length`);
    assert.ok(description.length >= 70 && description.length <= 160, `${route} description length`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://metkagram\\.github\\.io${route}">`));
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /"@type":"LearningResource"/);
    assert.match(html, /id="practice-set-guide"/);
    assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io${route}</loc>`));
  }
});

test("legacy ID routes point to canonical topic-set slugs", () => {
  for (const locale of ["en", "ru"]) for (const set of content.studySets.sets) {
    const html = page(legacyStudySetPath(locale, set));
    assert.match(html, new RegExp(`rel="canonical" href="https://metkagram\\.github\\.io${studySetPath(locale, set)}"`));
    assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${studySetPath(locale, set)}">`));
    assert.ok(html.includes(`<a href="${studySetPath(locale, set)}">`));
    assert.equal(sitemap.includes(`https://metkagram.github.io${legacyStudySetPath(locale, set)}`), false);
  }
});
