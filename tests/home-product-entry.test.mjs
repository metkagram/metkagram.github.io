import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("localized homepages make Pattern Lens the primary learner action", () => {
  const expectations = {
    en: {
      primary: "Start with a real sentence",
      intro: "Bring a real sentence you care about.",
      library: "Explore the pattern library",
    },
    ru: {
      primary: "Начать с реальной фразы",
      intro: "Принесите реальную фразу, которая вам нужна.",
      library: "Исследовать библиотеку паттернов",
    },
  };

  for (const [locale, copy] of Object.entries(expectations)) {
    const html = read(`dist/${locale}/index.html`);
    assert.match(html, new RegExp(`class="studio-primary-action" data-product-entry="lens" href="/${locale}/lens/"`));
    assert.match(html, new RegExp(`>${copy.primary}<`));
    assert.match(html, new RegExp(copy.intro.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(`data-product-entry="library" href="/${locale}/practice/"`));
    assert.match(html, new RegExp(copy.library));
    assert.doesNotMatch(html, new RegExp(`class="studio-primary-action" href="/${locale}/practice/"`));
  }
});

test("homepage product-entry patch is fail-fast and does not remove the library", () => {
  const source = read("scripts/finalize-product-direction.mjs");
  assert.match(source, /Homepage intro contract changed/);
  assert.match(source, /Homepage primary CTA contract changed/);
  assert.match(source, /Homepage library CTA contract changed/);
  assert.match(source, /data-product-entry=\\"lens\\"/);
  assert.match(source, /data-product-entry=\\"library\\"/);
});
