import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";

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

test("all source content validates and contains a complete C1 pattern curriculum", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 2240);
  assert.equal(counts.annotatedSentences, 25116);
  assert.ok(counts.advancedPatterns >= 1000);
  assert.equal(content.studySets.sets.length, 80);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.set_id && langComplete(pattern)));
  const hedPatterns = content.advancedPatterns.filter((pattern) => pattern.set_id === "HED");
  assert.equal(hedPatterns.length, 40);
  assert.ok(hedPatterns.every((pattern) => pattern.langs.every((lang) => lang.examples.length === 12)), "every HED pattern should match CON006 with 12 examples per language");
  const grammarSetIds = ["DET", "INF", "SUB", "FCS", "REL", "PRP", "WOR", "CAS", "ADJ", "KON"];
  assert.ok(grammarSetIds.every((setId) => content.studySets.sets.some((set) => set.id === setId)), "all grammar study sets must be present");
  assert.ok(grammarSetIds.every((setId) => content.advancedPatterns.filter((pattern) => pattern.set_id === setId).length === 40), "every grammar study set should contain 40 complete patterns");
  const questionSetIds = ["QYN", "QWH", "QSUB", "QOBJ", "QPRE", "QTAG", "QIND", "QNEG", "QCHO", "QCNF", "QCL", "QFOL", "QOP", "QCAU", "QPUR", "QTM", "QPLC", "QPRS", "QQNT", "QCMP", "QHYP", "QPRB", "QPOL", "QWRK", "QACA", "QDEC", "QNGT", "QREP", "QDIS", "QFRM"];
  assert.ok(questionSetIds.every((setId) => content.studySets.sets.some((set) => set.id === setId)), "all question study sets must be present");
  assert.ok(questionSetIds.every((setId) => content.advancedPatterns.filter((pattern) => pattern.set_id === setId).length === 40), "every question study set should contain 40 complete patterns");
  const functionalSetIds = ["PFR", "ADV", "RQT", "OFR", "PRM", "CMT", "PLN", "PRI", "GOA", "CNS", "EXM", "SUM", "ORG", "FEL", "TCT", "FBK", "SOL", "RSK", "PRS", "SOC"];
  assert.ok(functionalSetIds.every((setId) => content.studySets.sets.some((set) => set.id === setId)), "all functional study sets must be present");
  assert.ok(functionalSetIds.every((setId) => content.advancedPatterns.filter((pattern) => pattern.set_id === setId).length === 40), "every functional study set should contain 40 complete patterns");
  assert.equal(content.collections.english.dialogues.documents.length, 111);
  assert.equal(content.collections.english.patterns.documents.length, 353);
  assert.equal(content.collections.english.library.documents.length, 455);
  assert.equal(content.collections.german.dialogues.documents.length, 329);
  assert.equal(content.collections.german.patterns.documents.length, 496);
  assert.equal(content.collections.german.library.documents.length, 496);
});

function langComplete(pattern) {
  return pattern.langs.every((lang) => lang.formula && lang.example && lang.translation && lang.examples.length >= 8);
}

test("GitHub Pages artifact has root files and localized HTML", () => {
  for (const file of ["index.html", ".nojekyll", "404.html", "sitemap.xml", "robots.txt", "llms.txt", "data/catalog.json"]) {
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
  assert.match(ru, /Открыты к содержательным коллаборациям\./);
  assert.match(en, /https:\/\/play\.google\.com\/store\/apps\/details\?id=app\.metkagram\.android/);
  assert.match(en, /https:\/\/apps\.apple\.com\/us\/app\/grammar-cards-ai-tutor\/id6502211918/);
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
  assert.match(ru, /Исследовательская система, а не набор ярлыков/);
  assert.match(ru, /NLP-совместимые данные/);
  assert.match(ru, /Фраза остаётся живой\. Структура становится видимой\./);
});

test("articles, project notes and documentation offer accessible share actions", () => {
  const article = htmlFiles(DIST).find((file) => /\/explore\/english\/dialogues\/[^/]+\/index\.html$/.test(file));
  assert.ok(article, "an annotated article should exist");
  const files = [article, path.join(DIST, "en/method/index.html"), path.join(DIST, "ru/roadmap/index.html"), path.join(DIST, "en/history/index.html"), path.join(DIST, "ru/ai/index.html")];
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /data-share-bar/);
    assert.match(html, /data-copy-link/);
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
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/practice\/con001\//);
});

test("mobile apps and legal pages have direct routes, store links, and entity markup", () => {
  const apps = fs.readFileSync(path.join(DIST, "en/apps/index.html"), "utf8");
  const privacy = fs.readFileSync(path.join(DIST, "en/legal/privacy/index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(apps, /https:\/\/play\.google\.com\/store\/apps\/details\?id=app\.metkagram\.android/);
  assert.match(apps, /https:\/\/apps\.apple\.com\/us\/app\/grammar-cards-ai-tutor\/id6502211918/);
  assert.match(apps, /"MobileApplication"/);
  assert.match(apps, /"SoftwareApplication"/);
  assert.match(privacy, /<h1>Privacy Policy<\/h1>/);
  assert.match(privacy, /"@type":"WebPage"/);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/apps\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/legal\/privacy\//);
});

test("every generated page carries the current brand and discoverability metadata", () => {
  const files = htmlFiles(DIST).filter((file) => !file.startsWith(path.join(DIST, "assets")) && !/^google[a-z0-9_-]*\.html$/i.test(path.basename(file)));
  assert.ok(files.length >= 4988, "expected the complete generated page set");
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    assert.match(html, /<title>[^<]+<\/title>/, `${file} needs a title`);
    assert.match(html, /<meta name="description" content="[^"]+">/, `${file} needs a description`);
    assert.match(html, /<meta name="robots" content="(?:index,follow|max-image-preview|noindex,follow)/, `${file} needs crawl directives`);
    assert.match(html, /rel="canonical" href="https:\/\/metkagram\.github\.io\//, `${file} needs a production canonical`);
    assert.match(html, /assets\/social\/metkagram-social-preview-1200x630\.png/, `${file} needs the branded social preview`);
    assert.match(html, /og:image:width" content="1200"/, `${file} needs social image dimensions`);
    assert.match(html, /rel="manifest" href="\/assets\/web\/site\.webmanifest"/, `${file} needs the web manifest`);
    assert.doesNotMatch(html, /assets\/social-preview\.png/, `${file} must not use the legacy social preview`);
    const title = decodeEntities(html.match(/<title>([^<]+)<\/title>/)?.[1] || "");
    const description = decodeEntities(html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "");
    assert.ok(title.length <= 68, `${file} title must stay concise`);
    assert.ok(description.length <= 155, `${file} description must stay concise`);
  }
});
