import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PATTERN_ROOTS = ["en", "ru"].map((locale) => path.join(DIST, locale, "practice", "patterns"));

const CARD_TRANSLATION_RE = /(<div class="pattern-comparison-sentences">[\s\S]*?<\/div>)<div class="pattern-comparison-translation" data-native-translation hidden>([\s\S]*?)<\/div>/g;
const CARD_RE = /<(article|li) class="pattern-comparison-card[^\"]*"[\s\S]*?<\/\1>/g;

function htmlFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(target));
    else if (entry.isFile() && entry.name === "index.html") files.push(target);
  }
  return files;
}

export function reorderPatternLearningCard(source) {
  let changed = 0;
  const html = String(source).replace(CARD_TRANSLATION_RE, (_match, sentences, translationBody) => {
    changed += 1;
    return `<div class="pattern-comparison-translation">${translationBody}</div>${sentences}`;
  });
  return { html, changed };
}

function assertRussianFirst(html, file) {
  for (const match of html.matchAll(CARD_RE)) {
    const card = match[0];
    const russian = card.indexOf('class="pattern-comparison-translation"');
    if (russian === -1) continue;

    const english = card.indexOf('data-target-language="en"');
    const german = card.indexOf('data-target-language="de"');
    if (english !== -1 && russian > english) throw new Error(`Russian cue follows English in ${file}`);
    if (german !== -1 && russian > german) throw new Error(`Russian cue follows German in ${file}`);
    if (card.includes('class="pattern-comparison-translation" data-native-translation')) {
      throw new Error(`Russian cue is still controlled as a hidden native translation in ${file}`);
    }
  }
}

export function applyPatternLearningOrder() {
  let pagesChanged = 0;
  let cardsChanged = 0;

  for (const root of PATTERN_ROOTS) {
    for (const file of htmlFiles(root)) {
      const source = fs.readFileSync(file, "utf8");
      if (!source.includes('class="pattern-page')) continue;

      const result = reorderPatternLearningCard(source);
      assertRussianFirst(result.html, file);
      if (!result.changed) continue;

      fs.writeFileSync(file, result.html);
      pagesChanged += 1;
      cardsChanged += result.changed;
    }
  }

  if (!cardsChanged) throw new Error("No Pattern comparison translations were found to reorder");
  console.log(`Pattern learning order: ${cardsChanged} cards across ${pagesChanged} pages now render RU → EN → DE.`);
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  applyPatternLearningOrder();
}
