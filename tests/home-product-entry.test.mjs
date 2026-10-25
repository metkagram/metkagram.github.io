import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { markHomepageLibraryEntry } from "../src/home-product-entry.mjs";
import { localeHome } from "../src/render.mjs";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("localized homepages make Pattern Lens the primary learner action", () => {
  const expectations = {
    en: {
      primary: "Start with a real sentence",
      intro: "Bring a real sentence you care about.",
      library: "Patterns",
    },
    ru: {
      primary: "Начать с реальной фразы",
      intro: "Принесите реальную фразу, которая вам нужна.",
      library: "Паттерны",
    },
  };

  for (const [locale, copy] of Object.entries(expectations)) {
    const html = read(`dist/${locale}/index.html`);
    assert.match(html, new RegExp(`class="studio-primary-action" data-product-entry="lens" href="/${locale}/lens/"`));
    assert.match(html, new RegExp(`>${copy.primary}<`));
    assert.match(html, new RegExp(copy.intro.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(`<nav id="site-nav"[^>]*>[\\s\\S]*data-product-entry="library" href="/${locale}/practice/">${copy.library}</a>[\\s\\S]*?</nav>`));
    assert.doesNotMatch(html, new RegExp(`class="studio-primary-action" href="/${locale}/practice/"`));
    assert.doesNotMatch(html, /class="studio-(?:flow|pattern-sheet)"/);
  }
});

test("homepage product-entry patch keeps its intro and primary CTA guards", () => {
  const source = read("scripts/finalize-product-direction.mjs");
  assert.match(source, /Homepage intro contract changed/);
  assert.match(source, /Homepage primary CTA contract changed/);
  assert.match(source, /data-product-entry="lens"/);
});

test("library entry marks the existing useful navigation link without restoring the wall", () => {
  for (const locale of ["en", "ru"]) {
    const source = localeHome(locale);
    const html = markHomepageLibraryEntry(source, locale);
    assert.equal((html.match(/data-product-entry="library"/g) || []).length, 1);
    assert.equal(html.replace('data-product-entry="library" ', ""), source);
    assert.doesNotMatch(html, /class="studio-(?:flow|pattern-sheet)"/);
  }
});

test("library entry rejects missing, misdirected, or unlabelled navigation links even with a valid footer link", () => {
  for (const locale of ["en", "ru"]) {
    const source = localeHome(locale);
    const label = locale === "ru" ? "Паттерны" : "Patterns";
    const link = `<a href="/${locale}/practice/">${label}</a>`;
    assert.ok(source.includes(link));
    for (const replacement of ["", `<a href="/${locale}/method/">${label}</a>`, `<a href="/${locale}/practice/"> </a>`]) {
      const changed = source.replace(link, replacement);
      assert.ok(changed.includes(`href="/${locale}/practice/"`), "the remaining footer link must not mask a missing navigation entry");
      assert.throws(() => markHomepageLibraryEntry(changed, locale), /Homepage library CTA contract changed/);
    }
  }
});
