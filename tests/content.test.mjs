import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";
import { patternPath, patternUrl } from "../src/seo-slugs.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SEO_REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "seo-slugs.json"), "utf8"));
const LEGACY_PATTERN_IDS = new Set(Object.keys(SEO_REGISTRY.patterns).map((id) => id.toLowerCase()));

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.name.endsWith(".html") ? [target] : [];
  });
}

function decodeEntities(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#039;", "'");
}

test("source content validates and public Practice exposes the canonical curriculum", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 72);
  assert.ok(counts.annotatedSentences > 0);
  assert.ok(counts.advancedPatterns >= 600, `expected at least 600 canonical patterns, found ${counts.advancedPatterns}`);
  assert.ok(content.studySets.sets.length >= 20);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.set_id && langComplete(pattern)));
  const reasoningPatterns = content.advancedPatterns.filter((pattern) => pattern.reasoning?.move);
  const reasoningMoves = new Set(reasoningPatterns.map((pattern) => pattern.reasoning.move));
  assert.ok(reasoningPatterns.length >= 30);
  assert.ok(reasoningMoves.size >= 9, `expected the established reasoning vocabulary plus extensions, found ${reasoningMoves.size}`);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.quality?.translations_complete));
  for (const target of Object.values(content.collections)) {
    for (const collection of Object.values(target)) assert.equal(collection.documents.length, 12);
  }
});

function langComplete(pattern) {
  return pattern.langs.every((lang) => lang.formula && lang.example && lang.translation && lang.examples.length >= 2);
}

test("GitHub Pages artifact has a canonical hostname root and localized HTML", () => {
  for (const file of ["index.html", ".nojekyll", "404.html", "sitemap.xml", "robots.txt", "llms.txt", "data/catalog.json", "data/quality-report.json", "data/reasoning-frames/index.json", "seo/site-pages.json", "api/v1/teaching-manifest.json"]) {
    assert.ok(fs.existsSync(path.join(DIST, file)), `${file} must exist`);
  }
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  const root = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  assert.match(root, /<meta name="robots" content="index,follow/);
  assert.match(root, /<link rel="canonical" href="https:\/\/metkagram\.github\.io\/">/);
  assert.match(root, /<meta property="og:site_name" content="Metkagram">/);
  assert.match(root, /"@type":"WebSite"/);
  assert.match(root, /href="\/en\/"/);
  assert.match(root, /href="\/ru\/"/);
  assert.doesNotMatch(root, /location\.replace\(/);
  assert.doesNotMatch(root, /<meta http-equiv="refresh"/);
  assert.match(en, /<html lang="en">/);
  assert.match(en, /<span>Learn<\/span><span>a language<\/span><span>through<\/span><mark>patterns\.<\/mark>/);
  assert.match(en, /ANNOTATION STUDIO/);
  assert.match(en, /Pattern library/);
  assert.match(en, /class="studio-primary-action" data-product-entry="lens" href="\/en\/lens\/">Start with a real sentence/);
  assert.match(en, /data-product-entry="library" href="\/en\/practice\/">Explore the pattern library/);
  assert.doesNotMatch(en, /Open a topic set/);
  assert.doesNotMatch(en, /Разметить\./);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /<span>Учите<\/span><span>язык<\/span><span>через<\/span><mark>паттерны\.<\/mark>/);
  assert.match(ru, /СТУДИЯ РАЗМЕТКИ/);
  assert.match(ru, /class="studio-primary-action" data-product-entry="lens" href="\/ru\/lens\/">Начать с реальной фразы/);
  assert.match(ru, /data-product-entry="library" href="\/ru\/practice\/">Исследовать библиотеку паттернов/);
  assert.doesNotMatch(ru, /Открыть тематический сет/);
  assert.doesNotMatch(ru, /<span>Mark\.<\/span>/);
  assert.ok(fs.existsSync(path.join(DIST, "en/lens/index.html")));
  assert.ok(fs.existsSync(path.join(DIST, "ru/lens/index.html")));
  assert.match(en, /href="\/en\/lens\/"/);
  assert.match(ru, /href="\/ru\/lens\/"/);
  assert.doesNotMatch(en, /https:\/\/play\.google\.com\/store\/apps/);
  assert.doesNotMatch(en, /https:\/\/apps\.apple\.com\/us\/app/);
});

test("primary navigation stays stable while About remains a secondary destination", () => {
  for (const locale of ["en", "ru"]) {
    const page = fs.readFileSync(path.join(DIST, locale, "practice", "index.html"), "utf8");
    const header = page.slice(page.indexOf('<header class="site-header'), page.indexOf("</header>") + 9);
    const primary = header.slice(header.indexOf('<nav id="site-nav"'), header.indexOf("</nav>") + 6);
    assert.equal((primary.match(/<a /g) || []).length, 4);
    assert.doesNotMatch(header, /data-native-language-control/);
    assert.match(header, new RegExp(`href="/${locale}/practice/"`));
    assert.match(header, /class="locale-switch"/);
    assert.match(page, new RegExp(`class="footer-links"[\\s\\S]*href="/${locale}/about/"`));
    assert.match(page, /data-language-filter="en"/);
    assert.match(page, /data-language-filter="de"/);
  }
});

test("Pattern Lens keeps its interactive catalogue outside the initial document", () => {
  const lens = fs.readFileSync(path.join(DIST, "en/lens/index.html"), "utf8");
  const catalogue = fs.readFileSync(path.join(DIST, "data/pattern-lens-patterns.json"), "utf8");
  assert.match(lens, /data-pattern-lens/);
  assert.match(lens, /"locale":"en"/);
  assert.doesNotMatch(lens, /"patterns":\[/);
  assert.ok(Buffer.byteLength(lens) < 150_000, "Lens document should stay quick to parse");
  assert.ok(Buffer.byteLength(catalogue) > 50_000, "the reviewed Lens preview catalogue remains available on demand");
  assert.ok(Buffer.byteLength(catalogue) < 500_000, "the Lens preview catalogue must stay lightweight in a browser tab");
});

test("localized route switch preserves path context", () => {
  const file = path.join(DIST, "en/explore/german/dialogues/index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /href="\/ru\/explore\/german\/dialogues\/" lang="ru"/);
});

test("the public workspace is focused on reading datasets, not SRS features", () => {
  for (const locale of ["en", "ru"]) {
    const home = fs.readFileSync(path.join(DIST, locale, "index.html"), "utf8");
    assert.doesNotMatch(home, new RegExp(`href="/${locale}/review/"`));
    assert.doesNotMatch(home, new RegExp(`href="/${locale}/progress/"`));
    assert.ok(fs.existsSync(path.join(DIST, locale, "practice", "index.html")));
    assert.ok(fs.existsSync(path.join(DIST, locale, "ai", "index.html")));
    assert.ok(fs.existsSync(path.join(DIST, locale, "data", "index.html")));
    assert.ok(fs.existsSync(path.join(DIST, locale, "lens", "index.html")));
    assert.ok(!fs.existsSync(path.join(DIST, locale, "review", "index.html")));
    assert.ok(!fs.existsSync(path.join(DIST, locale, "progress", "index.html")));
  }
});

test("English and German tag guides are sentence-first and grouped by purpose", () => {
  const english = fs.readFileSync(path.join(DIST, "en/explore/english/annotation-rules/index.html"), "utf8");
  const german = fs.readFileSync(path.join(DIST, "ru/explore/german/annotation-rules/index.html"), "utf8");
  assert.match(english, /<h1>How to read English tags<\/h1>/);
  assert.match(english, /Sentence first, tags second/);
  assert.match(english, /research-oriented annotation scheme/);
  assert.match(english, /NLP work/);
  assert.match(english, /class="rule-group rule-group-subject"/);
  assert.match(english, /class="rule-group rule-group-helper"/);
  assert.match(german, /<h1>Как читать разметку немецких фраз<\/h1>/);
  assert.match(german, /Винительный падеж/);
  assert.match(german, /Модальный глагол/);
});

test("method routes keep the learning loop and annotation readable without JavaScript", () => {
  const en = fs.readFileSync(path.join(DIST, "en/method/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/method/index.html"), "utf8");
  assert.match(en, /Sentence → Tag → Structure → Pattern → Variation → Recall/);
  assert.match(en, /One coherent annotation system/);
  assert.match(en, /publicly inspectable English–German library for learning and NLP analysis/);
  assert.match(en, /spaced repetition\?/);
  assert.match(en, /role="tooltip"/);
  assert.match(en, /aria-describedby="method-tag-/);
  assert.match(ru, /Фраза → Метка → Структура → Паттерн → Вариация → Воспроизведение/);
  assert.match(ru, /Единая система разметки/);
  assert.match(ru, /Публично доступный для изучения корпус с функциональной разметкой на уровне слов/);
  assert.match(ru, /Паттерн внутри фразы\./);
});

test("home pages make the unified annotation and pattern routes explicit", () => {
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  assert.match(en, /Learn a language/);
  assert.match(en, /href="\/en\/explore\/"/);
  assert.match(en, /href="\/en\/practice\/"/);
  assert.match(en, /href="\/en\/ai\/"/);
  assert.match(en, /href="\/en\/ideas\/"/);
  assert.match(en, /Propose an idea/);
  assert.match(ru, /Изучать язык/);
  assert.match(ru, /href="\/ru\/explore\/"/);
  assert.match(ru, /href="\/ru\/practice\/"/);
  assert.match(ru, /href="\/ru\/ai\/"/);
  assert.match(ru, /href="\/ru\/ideas\/"/);
  assert.match(ru, /Предложить идею/);
});

test("inline grammar tags keep a visible separator before their words", () => {
  const dialogue = fs.readFileSync(path.join(DIST, "en/explore/english/dialogues/IkXWCWXrzyFAUh2qVACA/index.html"), "utf8");
  const method = fs.readFileSync(path.join(DIST, "en/method/index.html"), "utf8");
  assert.match(dialogue, /<span class="annotation-tag"[^>]*>[^<]+<\/span>\s+<span class="annotation-word"/);
  assert.match(method, /<span class="annotation-tag"[^>]*>[^<]+<\/span>\s+<span class="annotation-word"/);
});

test("generated pattern pages preserve stable pattern URLs and structured data", () => {
  const content = loadContent();
  const pattern = content.advancedPatterns.find((item) => item.id === "CLA002") || content.advancedPatterns[0];
  const page = fs.readFileSync(routeFile(patternPath("en", pattern)), "utf8");
  assert.match(page, /data-pattern-id=/);
  assert.match(page, /application\/ld\+json/);
  assert.match(page, new RegExp(pattern.id, "i"));
  assert.match(page, new RegExp(patternUrl("en", pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

function routeFile(route) {
  return path.join(DIST, ...route.split("/").filter(Boolean), "index.html");
}

test("canonical Pattern URLs remain registered and every active page is reachable", () => {
  const content = loadContent();
  for (const pattern of content.advancedPatterns) {
    assert.ok(LEGACY_PATTERN_IDS.has(pattern.id.toLowerCase()), `${pattern.id} needs a stable SEO slug entry`);
    for (const locale of ["en", "ru"]) {
      assert.ok(fs.existsSync(routeFile(patternPath(locale, pattern))), `${pattern.id} lost ${locale} page`);
    }
  }
});

test("build date stays tied to the release, not wall-clock generation", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.generatedAt, SITE_RELEASE_DATE);
});

test("all generated HTML uses the canonical hostname", () => {
  for (const file of htmlFiles(DIST)) {
    const html = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(html, /https?:\/\/(?:www\.)?metkagram\.com/i, `${file} still references the retired hostname`);
  }
});

test("JSON-LD URLs decode to valid canonical URLs", () => {
  for (const file of htmlFiles(DIST).slice(0, 200)) {
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const payload = JSON.parse(decodeEntities(match[1]));
      const records = Array.isArray(payload) ? payload : [payload];
      for (const record of records) {
        for (const key of ["url", "@id"]) {
          if (!record?.[key]) continue;
          const url = String(record[key]);
          assert.ok(url.startsWith("https://metkagram.github.io"), `${file} has noncanonical ${key}: ${url}`);
        }
      }
    }
  }
});
