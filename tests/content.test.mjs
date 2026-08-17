import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

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

test("source content validates and public practice stays deliberately bounded", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 72);
  assert.ok(counts.annotatedSentences > 0);
  assert.equal(counts.advancedPatterns, 30);
  assert.deepEqual(content.studySets.sets.map((set) => set.id).sort(), ["CAU", "CLR", "CND", "EVD", "NEG", "PRB"]);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.set_id && langComplete(pattern)));
  assert.ok(content.advancedPatterns.every((pattern) => pattern.reasoning?.move));
  assert.equal(new Set(content.advancedPatterns.map((pattern) => pattern.reasoning.move)).size, 9);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.quality?.translations_complete));
  for (const target of Object.values(content.collections)) {
    for (const collection of Object.values(target)) assert.equal(collection.documents.length, 12);
  }
});

function langComplete(pattern) {
  return pattern.langs.every((lang) => lang.formula && lang.example && lang.translation && lang.examples.length >= 2);
}

test("GitHub Pages artifact has root files and localized HTML", () => {
  for (const file of ["index.html", ".nojekyll", "404.html", "sitemap.xml", "robots.txt", "llms.txt", "data/catalog.json", "data/quality-report.json", "data/reasoning-frames/index.json", "seo/site-pages.json", "api/v1/teaching-manifest.json"]) {
    assert.ok(fs.existsSync(path.join(DIST, file)), `${file} must exist`);
  }
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  assert.match(en, /<html lang="en">/);
  assert.match(en, /See the structure\. Use the phrase\./);
  assert.doesNotMatch(en, /Читайте фразы\. Замечайте структуру\./);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /Читайте фразы\. Замечайте структуру\./);
  assert.doesNotMatch(ru, /See the structure\. Use the phrase\./);
  assert.match(en, /Open to thoughtful collaborations\./);
  assert.match(ru, /Открыты к полезным партнёрствам\./);
  assert.ok(fs.existsSync(path.join(DIST, "en/lens/index.html")));
  assert.ok(fs.existsSync(path.join(DIST, "ru/lens/index.html")));
  assert.match(en, /href="\/en\/lens\/"/);
  assert.match(ru, /href="\/ru\/lens\/"/);
  assert.doesNotMatch(en, /https:\/\/play\.google\.com\/store\/apps/);
  assert.doesNotMatch(en, /https:\/\/apps\.apple\.com\/us\/app/);
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
  assert.match(en, /Sentence → Signal → Structure → Pattern → Variation → Recall/);
  assert.match(en, /A research system, not a collection of labels/);
  assert.match(en, /NLP-ready data/);
  assert.match(en, /spaced repetition\?/);
  assert.match(en, /role="tooltip"/);
  assert.match(en, /aria-describedby="method-tag-/);
  assert.match(ru, /Система, а не набор ярлыков/);
  assert.match(ru, /Публично доступный для изучения корпус с функциональной разметкой на уровне слов/);
  assert.match(ru, /Фраза остаётся живой\. Структура становится видимой\./);
});

test("home pages include a useful FAQ for learners and agents", () => {
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  assert.match(en, /What can you do with Metkagram\?/);
  assert.match(en, /Can an AI agent use the data\?/);
  assert.match(en, /Open agent resources/);
  assert.match(ru, /Что можно делать с Metkagram\?/);
  assert.match(ru, /Может ли ИИ использовать данные\?/);
});

test("support pages explain sponsorship without compromising editorial independence", () => {
  const en = fs.readFileSync(path.join(DIST, "en/support/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/support/index.html"), "utf8");
  assert.match(en, /Partner with Metkagram: investment, research and language data/);
  assert.match(en, /Sponsors do not receive the right to alter research findings/);
  assert.match(en, /Metkagram/);
  assert.match(en, /without inventing traction claims/);
  assert.match(en, /linkedin\.com\/company\/metalhatscats/);
  assert.match(ru, /Партнёрство и инвестиции в Metkagram/);
  assert.match(ru, /Спонсоры не получают права менять результаты исследований/);
});

test("research programme publishes hypotheses, measures, evidence limits and reproducible assets", () => {
  const en = fs.readFileSync(path.join(DIST, "en/research/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/research/index.html"), "utf8");
  assert.match(en, /Measure the method, not just describe it\./);
  assert.match(en, /Primary measure/);
  assert.match(en, /no efficacy claim made/);
  assert.match(en, /"@type":"ResearchProject"/);
  assert.match(en, /href="\/en\/ai\/"/);
  assert.match(ru, /Измерять метод, а не только описывать его\./);
  assert.match(ru, /заявления об эффекте не сделаны/);
});

test("dataset directory exposes human-readable Dataset and DataCatalog pages", () => {
  for (const locale of ["en", "ru"]) {
    const index = fs.readFileSync(path.join(DIST, locale, "data", "index.html"), "utf8");
    assert.match(index, /"@type":"DataCatalog"/);
    for (const key of ["annotations", "patterns", "reasoning"]) {
      const page = fs.readFileSync(path.join(DIST, locale, "data", key, "index.html"), "utf8");
      assert.match(page, /"@type":"Dataset"/);
      assert.match(page, /Dataset/);
    }
  }
});

test("articles, project notes and documentation offer accessible share actions", () => {
  const article = htmlFiles(DIST).find((file) => /\/explore\/english\/dialogues\/[^/]+\/index\.html$/.test(file));
  assert.ok(article, "an annotated article should exist");
  const files = [article, path.join(DIST, "en/method/index.html"), path.join(DIST, "ru/roadmap/index.html"), path.join(DIST, "en/history/index.html"), path.join(DIST, "ru/ai/index.html")];
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /data-share-bar/);
    assert.match(html, /data-copy-link/);
    assert.match(html, /data-print-page/);
    assert.match(html, /t\.me\/share\/url/);
    assert.match(html, /vk\.com\/share\.php/);
    assert.match(html, /x\.com\/intent\/post/);
  }
});

test("canonical, hreflang and sitemap use the production Pages origin", () => {
  const file = path.join(DIST, "ru/explore/english/patterns/index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /rel="canonical" href="https:\/\/metkagram\.github\.io\/ru\/explore\/english\/patterns\/"/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="ru"/);
  assert.match(html, /hreflang="x-default"/);
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/practice\/clf041\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/research\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/lens\//);
  assert.ok(sitemap.includes(`<lastmod>${SITE_RELEASE_DATE}</lastmod>`));
});

test("public reasoning pattern pages render both target languages", () => {
  const html = fs.readFileSync(path.join(DIST, "en/practice/clf041/index.html"), "utf8");
  assert.match(html, /data-target-language="en"/);
  assert.match(html, /data-target-language="de"/);
  assert.match(html, /id="reasoning-move"/);
});

test("archived mobile app route points learners to the web product without active-app schema", () => {
  const apps = fs.readFileSync(path.join(DIST, "en/apps/index.html"), "utf8");
  const privacy = fs.readFileSync(path.join(DIST, "en/legal/privacy/index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(apps, /The mobile app became a research stage/);
  assert.match(apps, /href="\/en\/lens\/"/);
  assert.match(apps, /href="\/en\/practice\/"/);
  assert.doesNotMatch(apps, /https:\/\/play\.google\.com\/store\/apps/);
  assert.doesNotMatch(apps, /https:\/\/apps\.apple\.com\/us\/app/);
  assert.doesNotMatch(apps, /"MobileApplication"/);
  assert.doesNotMatch(apps, /"SoftwareApplication"/);
  assert.match(privacy, /<h1>Privacy Policy<\/h1>/);
  assert.match(privacy, /"@type":"WebPage"/);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/apps\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/legal\/privacy\//);
});

test("every generated page carries the current brand and discoverability metadata", () => {
  const files = htmlFiles(DIST).filter((file) => !file.startsWith(path.join(DIST, "assets")) && !/^google[a-z0-9_-]*\.html$/i.test(path.basename(file)));
  assert.ok(files.length >= 200, "expected the bounded generated page set");
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /<title>[^<]+<\/title>/, `${file} needs a title`);
    assert.match(html, /<meta name="description" content="[^"]+">/, `${file} needs a description`);
    assert.match(html, /<meta name="robots" content="(?:index,follow|max-image-preview|noindex,follow)/, `${file} needs crawl directives`);
    assert.match(html, /rel="canonical" href="https:\/\/metkagram\.github\.io\//, `${file} needs a production canonical`);
    assert.match(html, /property="og:url" content="https:\/\/metkagram\.github\.io\//, `${file} needs a canonical social URL`);
    assert.match(html, /assets\/social\/metkagram-social-preview-1200x630\.png/, `${file} needs the branded social preview`);
    assert.match(html, /property="og:image:type" content="image\/png"/, `${file} needs a social image MIME type`);
    assert.match(html, /og:image:width" content="1200"/, `${file} needs social image dimensions`);
    assert.match(html, /rel="manifest" href="\/assets\/web\/site\.webmanifest"/, `${file} needs the web manifest`);
    assert.match(html, /"@id":"https:\/\/metkagram\.github\.io\/[^"]*#webpage"/, `${file} needs page-level structured data`);
    assert.match(html, /data-share-bar/, `${file} needs page sharing controls`);
    assert.match(html, /data-print-page/, `${file} needs a print control`);
    assert.ok(html.includes(`"dateModified":"${SITE_RELEASE_DATE}"`), `${file} needs a verified modification date`);
    assert.doesNotMatch(html, /assets\/social-preview\.png/, `${file} must not use the legacy social preview`);
    const title = decodeEntities(html.match(/<title>([^<]+)<\/title>/)?.[1] || "");
    const description = decodeEntities(html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "");
    assert.ok(title.length <= 68, `${file} title must stay concise`);
    assert.ok(description.length <= 155, `${file} description must stay concise`);
  }
});

test("SEO inventory covers every generated indexable route", () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo/site-pages.json"), "utf8"));
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.equal(inventory.pageCount, inventory.pages.length);
  assert.ok(inventory.pageCount >= 200);
  assert.ok(inventory.pages.every((page) => page.canonical === `https://metkagram.github.io${page.route}` || page.route === "/404.html/"));
  assert.ok(inventory.pages.every((page) => page.language && page.title && page.description));
  assert.ok(inventory.pages.every((page) => page.lastModified));
  for (const language of ["en", "ru"]) {
    const localized = inventory.pages.filter((page) => page.language === language);
    assert.equal(new Set(localized.map((page) => page.title)).size, localized.length, `${language} SEO titles must be unique`);
    assert.equal(new Set(localized.map((page) => page.description)).size, localized.length, `${language} SEO descriptions must be unique`);
  }
  for (const route of ["/en/", "/en/research/", "/en/data/", "/en/data/patterns/", "/en/support/", "/en/practice/clf041/", "/en/lens/"]) {
    assert.ok(inventory.pages.some((page) => page.route === route), `SEO inventory missing ${route}`);
    assert.ok(sitemap.includes(`https://metkagram.github.io${route}`), `sitemap missing ${route}`);
  }
});
