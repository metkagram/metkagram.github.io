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

test("source content validates and public Practice exposes the full curriculum", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 72);
  assert.ok(counts.annotatedSentences > 0);
  assert.ok(counts.advancedPatterns >= 1000, `expected at least 1,000 patterns, found ${counts.advancedPatterns}`);
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

test("GitHub Pages artifact has root files and localized HTML", () => {
  for (const file of ["index.html", ".nojekyll", "404.html", "sitemap.xml", "robots.txt", "llms.txt", "data/catalog.json", "data/quality-report.json", "data/reasoning-frames/index.json", "seo/site-pages.json", "api/v1/teaching-manifest.json"]) {
    assert.ok(fs.existsSync(path.join(DIST, file)), `${file} must exist`);
  }
  const en = fs.readFileSync(path.join(DIST, "en/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/index.html"), "utf8");
  const root = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  assert.match(root, /location\.replace\("\/" \+ preferredLocale \+ "\/"\)/);
  assert.match(root, /<meta http-equiv="refresh" content="0;url=\/en\/">/);
  assert.match(root, /<meta name="robots" content="noindex,follow">/);
  assert.match(root, /<link rel="canonical" href="https:\/\/metkagram\.github\.io\/en\/">/);
  assert.doesNotMatch(root, /gateway-body|Language lives/);
  assert.match(en, /<html lang="en">/);
  assert.match(en, /<span>Learn<\/span><span>a language<\/span><span>through<\/span><mark>patterns\.<\/mark>/);
  assert.match(en, /ANNOTATION STUDIO/);
  assert.match(en, /Pattern library/);
  assert.match(en, /class="studio-primary-action" href="\/en\/practice\/">Explore patterns/);
  assert.doesNotMatch(en, /Open a topic set/);
  assert.doesNotMatch(en, /Разметить\./);
  assert.match(ru, /<html lang="ru">/);
  assert.match(ru, /<span>Учите<\/span><span>язык<\/span><span>через<\/span><mark>паттерны\.<\/mark>/);
  assert.match(ru, /СТУДИЯ РАЗМЕТКИ/);
  assert.match(ru, /class="studio-primary-action" href="\/ru\/practice\/">Исследовать паттерны/);
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
  assert.match(en, /open English–German library for learning and NLP analysis/);
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
  assert.match(dialogue, /<\/button>&nbsp;An /);
  assert.match(dialogue, /<\/button>&nbsp;you /);
  assert.match(method, /<\/button>&nbsp;I<\/span>/);
  assert.match(fs.readFileSync(path.join(ROOT, "public/assets/styles.css"), "utf8"), /\.annotated-token > \.grammar-tag[^\{]+\{ margin-inline-end: \.32rem; \}/);
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

test("ideas pages turn suggestions into bounded partnership proposals", () => {
  const en = fs.readFileSync(path.join(DIST, "en/ideas/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/ideas/index.html"), "utf8");
  for (const page of [en, ru]) {
    assert.match(page, /href="\/(?:en|ru)\/contact\/"/);
    assert.match(page, /href="\/(?:en|ru)\/support\/"/);
    assert.match(page, /class="ideas-card-grid"/);
    assert.match(page, /class="ideas-card-grid ideas-card-grid--partnerships"/);
    assert.match(page, /class="ideas-brief section-pad ruled"/);
  }
  assert.match(en, /Ideas and partnerships with Metkagram/);
  assert.match(en, /One problem\. One next step\. One success signal\./);
  assert.match(ru, /Идеи и партнёрства с Metkagram/);
  assert.match(ru, /Одна проблема\. Один следующий шаг\. Один критерий успеха\./);
});

test("contact pages give learners and partners two direct, localized contact channels", () => {
  const en = fs.readFileSync(path.join(DIST, "en/contact/index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru/contact/index.html"), "utf8");
  for (const page of [en, ru]) {
    assert.match(page, /mailto:metalhatscats@gmail\.com/);
    assert.match(page, /linkedin\.com\/company\/metalhatscats/);
    assert.match(page, /class="contact-channel contact-channel--email"/);
    assert.match(page, /class="contact-channel contact-channel--linkedin"/);
  }
  assert.match(en, /Start with a clear question\./);
  assert.match(ru, /Начнём с ясного вопроса\./);
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
    assert.match(html, /linkedin\.com\/sharing\/share-offsite/);
    assert.match(html, /wa\.me\/\?text=/);
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
  assert.ok(sitemap.includes(patternUrl("en", "CLF041")));
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/research\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/lens\//);
  assert.ok(sitemap.includes(`<lastmod>${SITE_RELEASE_DATE}</lastmod>`));
});

test("public reasoning pattern pages render both target languages", () => {
  const html = fs.readFileSync(path.join(DIST, patternPath("en", "CLF041").slice(1), "index.html"), "utf8");
  assert.match(html, /data-target-language="en"/);
  assert.match(html, /data-target-language="de"/);
  assert.match(html, /01<\/span><p class="eyebrow">Structure<\/p>/);
  assert.match(html, /02<\/span><p class="eyebrow">Anchor phrase<\/p>/);
  assert.match(html, /03<\/b>Try variations/);
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
  assert.ok(files.length >= 200, "expected the generated page set");
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    if (html.includes('http-equiv="refresh"')) continue;
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
    for (const match of html.matchAll(/href="\/(?:en|ru)\/practice\/([^/"?#]+)\//g)) {
      assert.equal(LEGACY_PATTERN_IDS.has(match[1]), false, `${file} links to legacy pattern route ${match[0]}`);
    }
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
  for (const route of ["/en/", "/en/research/", "/en/data/", "/en/data/patterns/", "/en/support/", patternPath("en", "CLF041"), "/en/lens/"]) {
    assert.ok(inventory.pages.some((page) => page.route === route), `SEO inventory missing ${route}`);
    assert.ok(sitemap.includes(`https://metkagram.github.io${route}`), `sitemap missing ${route}`);
  }
});
