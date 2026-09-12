import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const STUDY_SETS_FILE = path.join(ROOT, "data", "study-sets.json");

const LABEL_OVERRIDES = {
  MOD: { en: "Modals", ru: "Модальные глаголы" }
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walkHtml(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(file);
    return entry.isFile() && entry.name.endsWith(".html") ? [file] : [];
  });
}

function loadLabels() {
  const studySets = JSON.parse(fs.readFileSync(STUDY_SETS_FILE, "utf8"));
  const labels = new Map();
  for (const set of studySets.sets || []) {
    const id = String(set.id || "").trim().toUpperCase();
    if (!id) continue;
    labels.set(id, {
      en: LABEL_OVERRIDES[id]?.en || set.title_en || id,
      ru: LABEL_OVERRIDES[id]?.ru || set.title_ru || set.title_en || id
    });
  }
  return labels;
}

function compileLabelMatchers(labels) {
  const ids = [...labels.keys()]
    .sort((a, b) => b.length - a.length || a.localeCompare(b))
    .map(escapeRegExp);
  if (!ids.length) throw new Error("Study-set label humanization requires at least one set ID");
  const alternatives = ids.join("|");
  return {
    option: /(<option\b[^>]*\bvalue="([^"]+)"[^>]*>)([^<]*)(<\/option>)/gi,
    eyebrow: /(<p\b[^>]*\bclass="[^"]*\beyebrow\b[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/gi,
    small: /(<small\b[^>]*>)([\s\S]*?)(<\/small>)/gi,
    separated: new RegExp(`(\\s·\\s)(${alternatives})(\\s·\\s)`, "gi"),
    separatedAudit: new RegExp(`\\s·\\s(?:${alternatives})\\s·\\s`, "i")
  };
}

function replaceSeparatedIds(inner, locale, labels, separated) {
  separated.lastIndex = 0;
  return inner.replace(separated, (match, before, rawId, after) => {
    const localized = labels.get(String(rawId).toUpperCase());
    if (!localized) return match;
    return `${before}${localized[locale] || localized.en}${after}`;
  });
}

function replaceVisibleSetIds(html, locale, labels, matchers) {
  let result = html.replace(matchers.option, (match, open, rawValue, visible, close) => {
    const id = String(rawValue).trim().toUpperCase();
    const localized = labels.get(id);
    if (!localized || String(visible).trim().toUpperCase() !== id) return match;
    return `${open}${localized[locale] || localized.en}${close}`;
  });

  for (const blockPattern of [matchers.eyebrow, matchers.small]) {
    blockPattern.lastIndex = 0;
    result = result.replace(blockPattern, (match, open, inner, close) => {
      const visible = replaceSeparatedIds(inner, locale, labels, matchers.separated);
      return visible === inner ? match : `${open}${visible}${close}`;
    });
  }

  return result;
}

function assertNoVisibleTechnicalSetIds(html, file, labels, matchers) {
  matchers.option.lastIndex = 0;
  for (const match of html.matchAll(matchers.option)) {
    const rawValue = String(match[2]).trim().toUpperCase();
    if (labels.has(rawValue) && String(match[3]).trim().toUpperCase() === rawValue) {
      throw new Error(`Visible technical study-set ID ${rawValue} remains in ${path.relative(ROOT, file)}`);
    }
  }

  for (const blockPattern of [matchers.eyebrow, matchers.small]) {
    blockPattern.lastIndex = 0;
    for (const match of html.matchAll(blockPattern)) {
      if (matchers.separatedAudit.test(match[2])) {
        throw new Error(`Visible technical study-set ID remains in ${path.relative(ROOT, file)}`);
      }
    }
  }
}

function main() {
  const labels = loadLabels();
  const matchers = compileLabelMatchers(labels);
  let changedFiles = 0;

  for (const locale of ["en", "ru"]) {
    const practiceRoot = path.join(DIST, locale, "practice");
    for (const file of walkHtml(practiceRoot)) {
      const before = fs.readFileSync(file, "utf8");
      const after = replaceVisibleSetIds(before, locale, labels, matchers);
      assertNoVisibleTechnicalSetIds(after, file, labels, matchers);
      if (after !== before) {
        fs.writeFileSync(file, after);
        changedFiles += 1;
      }
    }
  }

  console.log(`Humanized visible study-set labels in ${changedFiles} Practice HTML files.`);
}

main();
