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

function replaceVisibleSetIds(html, locale, labels) {
  let result = html;

  for (const [id, localized] of labels) {
    const label = localized[locale] || localized.en;
    const technical = escapeRegExp(id);

    // Keep the canonical ID as the option value for filtering, but never expose
    // that internal value as the option label.
    result = result.replace(
      new RegExp(`(<option\\b[^>]*\\bvalue="${technical}"[^>]*>)${technical}(<\\/option>)`, "gi"),
      `$1${label}$2`
    );

    // Pattern headers and index metadata use middle-dot separators. Replace only
    // the standalone set/group slot; stable pattern IDs such as MOD001 stay intact.
    const separatedTechnicalId = new RegExp(`(\\s·\\s)${technical}(\\s·\\s)`, "gi");
    result = result.replace(/<p\b([^>]*\bclass="[^"]*\beyebrow\b[^"]*"[^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
      const visible = inner.replace(separatedTechnicalId, `$1${label}$2`);
      return `<p${attrs}>${visible}</p>`;
    });
    result = result.replace(/<small\b([^>]*)>([\s\S]*?)<\/small>/gi, (match, attrs, inner) => {
      const visible = inner.replace(separatedTechnicalId, `$1${label}$2`);
      return `<small${attrs}>${visible}</small>`;
    });
  }

  return result;
}

function assertNoVisibleTechnicalSetIds(html, file, labels) {
  for (const id of labels.keys()) {
    const technical = escapeRegExp(id);
    const rawOption = new RegExp(`<option\\b[^>]*\\bvalue="${technical}"[^>]*>${technical}<\\/option>`, "i");
    const separatedRawId = new RegExp(`\\s·\\s${technical}\\s·\\s`, "i");
    const visibleBlocks = [
      ...html.matchAll(/<p\b[^>]*\bclass="[^"]*\beyebrow\b[^"]*"[^>]*>([\s\S]*?)<\/p>/gi),
      ...html.matchAll(/<small\b[^>]*>([\s\S]*?)<\/small>/gi)
    ].map((match) => match[1]);

    if (rawOption.test(html) || visibleBlocks.some((text) => separatedRawId.test(text))) {
      throw new Error(`Visible technical study-set ID ${id} remains in ${path.relative(ROOT, file)}`);
    }
  }
}

function main() {
  const labels = loadLabels();
  let changedFiles = 0;

  for (const locale of ["en", "ru"]) {
    const practiceRoot = path.join(DIST, locale, "practice");
    for (const file of walkHtml(practiceRoot)) {
      const before = fs.readFileSync(file, "utf8");
      const after = replaceVisibleSetIds(before, locale, labels);
      assertNoVisibleTechnicalSetIds(after, file, labels);
      if (after !== before) {
        fs.writeFileSync(file, after);
        changedFiles += 1;
      }
    }
  }

  console.log(`Humanized visible study-set labels in ${changedFiles} Practice HTML files.`);
}

main();
