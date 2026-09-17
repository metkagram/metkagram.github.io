import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("localized homepages lead with the pattern library and one real annotated example", () => {
  const expectations = {
    en: {
      primary: "Open the pattern library",
      lede: "See how a sentence works",
      exampleLabel: "A real example from the library",
      listAll: "Browse the whole library",
    },
    ru: {
      primary: "Открыть библиотеку паттернов",
      lede: "Разберите, как устроена фраза",
      exampleLabel: "Настоящий пример из библиотеки",
      listAll: "Вся библиотека",
    },
  };

  for (const [locale, copy] of Object.entries(expectations)) {
    const html = read(`dist/${locale}/index.html`);
    assert.match(html, new RegExp(`class="home-primary-action" data-product-entry="library" href="/${locale}/practice/"`));
    assert.match(html, new RegExp(`>${copy.primary}<`));
    assert.match(html, new RegExp(copy.lede.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(copy.exampleLabel));
    assert.match(html, /class="annotated-line home-example-sentence" lang="en"/, "real annotated English sentence");
    assert.match(html, /class="annotated-token (subject|verb|object|helper)"/, "real annotation markup");
    assert.match(html, /class="home-example-cue" lang="ru"/, "Russian cue stays content, not interface");
    assert.match(html, /class="home-pattern-list"/);
    assert.ok((html.match(/<ol class="home-pattern-list">[\s\S]*?<\/ol>/)?.[0].match(/<li>/g) || []).length >= 5, "pattern preview entries present");
    assert.match(html, new RegExp(copy.listAll));
    assert.doesNotMatch(html, /studio-primary-action/);
  }
});

test("homepage example pattern is pinned in the renderer and no post-build home patch remains", () => {
  const render = read("src/render.mjs");
  assert.match(render, /HOME_EXAMPLE_PATTERN_ID = "CON001"/);
  const finalize = read("scripts/finalize-product-direction.mjs");
  assert.doesNotMatch(finalize, /patchHomeEntry/);
});
