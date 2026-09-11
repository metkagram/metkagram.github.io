import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { patternToCanonicalCards } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";
import { patternPath } from "../src/seo-slugs.mjs";
import { SITE_URL } from "../src/site.mjs";
import { loadPatternAnnotations } from "./build.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const CARD_COUNT = 50;
const LANGUAGES = ["en", "de"];
const PRIORITY_SETS = [
  "HED", "ARG", "PRO", "CLR", "EVD", "CAU", "CND", "RQT", "NEG",
  "CMP", "FRM", "UNC", "DEC", "HYP", "SYS", "CDG", "PST", "META",
];
const PRIORITY = new Map(PRIORITY_SETS.map((id, index) => [id, PRIORITY_SETS.length - index]));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function write(relative, contents) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(DIST, relative), "utf8"));
}

function scorePattern(pattern) {
  let score = (PRIORITY.get(pattern.set_id) || 0) * 100;
  if (pattern.reasoning?.move) score += 30;
  if (pattern.gen?.status === "curated") score += 20;
  if (pattern.practice?.mode) score += 10;
  score += Math.min(9, (pattern.langs || []).reduce((sum, language) => sum + 1 + (language.examples || []).length, 0));
  return score;
}

function annotatedExample(card) {
  let output = "";
  let cursor = 0;
  const spans = [...(card.spans || [])].sort((a, b) => a.start - b.start);
  for (const span of spans) {
    output += escapeHtml(card.text.slice(cursor, span.start));
    const value = card.text.slice(span.start, span.end);
    output += `<mark class="mark mark-${escapeHtml(span.type)}" data-mark-type="${escapeHtml(span.type)}"><span>${escapeHtml(value)}</span><small>${escapeHtml(span.label)}</small></mark>`;
    cursor = span.end;
  }
  output += escapeHtml(card.text.slice(cursor));
  return output;
}

function cardHtml({ pattern, card, language }) {
  const lang = pattern.langs.find((item) => item.lang === language);
  const canonicalPath = patternPath("en", pattern.id);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const title = `${lang.formula} — ${pattern.id} Pattern Card`;
  const description = `Annotated ${language.toUpperCase()} Pattern Card for ${pattern.id}, generated from the canonical Metkagram record.`;
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;background:#f5f5f2}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}.card-shell{width:min(1200px,100%)}
    .pattern-card{aspect-ratio:16/9;min-height:560px;background:#fff;border:1px solid #d9d9d2;border-radius:28px;padding:52px 58px 42px;display:flex;flex-direction:column;box-shadow:0 16px 46px rgba(0,0,0,.08)}
    .card-head{display:flex;justify-content:space-between;align-items:center;gap:24px}.brand{font-weight:800;letter-spacing:.02em}.meta{display:flex;gap:10px;align-items:center;color:#555;font-size:14px}.pill{border:1px solid #ccc;border-radius:999px;padding:5px 10px;font-weight:700;color:#222}
    h1{font-size:clamp(30px,4.2vw,58px);line-height:1.05;letter-spacing:-.025em;margin:68px 0 34px;max-width:1000px}.example-label{font-size:14px;text-transform:uppercase;letter-spacing:.11em;color:#666;font-weight:750;margin:0 0 14px}
    .example{font-size:clamp(24px,3vw,42px);line-height:1.48;margin:0;max-width:1050px}.mark{display:inline-flex;position:relative;flex-direction:column;vertical-align:baseline;background:transparent;color:inherit;padding:0 .06em;border-bottom:4px solid #888}.mark small{font-size:11px;line-height:1.1;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-top:4px;white-space:nowrap}
    .mark-subject{border-color:#7950f2}.mark-verb{border-color:#2f9e44}.mark-helper{border-color:#1971c2}.mark-function{border-color:#e67700}.mark-pattern_part{border-color:#c2255c}
    .card-foot{margin-top:auto;padding-top:30px;border-top:1px solid #ecece7;display:flex;justify-content:space-between;gap:24px;align-items:flex-end;color:#555;font-size:13px}.canonical{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.attribution{text-align:right;max-width:420px}
    @media(max-width:720px){body{padding:0}.pattern-card{border-radius:0;min-height:100vh;aspect-ratio:auto;padding:32px 24px}.card-head,.card-foot{align-items:flex-start;flex-direction:column}.attribution{text-align:left}h1{margin-top:48px}.example{font-size:28px}.mark small{font-size:9px}}
    @media print{@page{size:13.333in 7.5in;margin:0}body{padding:0;background:#fff}.card-shell{width:100%}.pattern-card{width:13.333in;height:7.5in;aspect-ratio:auto;border:0;border-radius:0;box-shadow:none;page-break-after:always}}
  </style>
</head>
<body>
  <main class="card-shell">
    <article class="pattern-card" data-pattern-card="${escapeHtml(pattern.id)}" data-learning-language="${language}">
      <header class="card-head"><div class="brand">Metkagram</div><div class="meta"><span class="pill">${language.toUpperCase()}</span><code>${escapeHtml(pattern.id)}</code></div></header>
      <h1>${escapeHtml(lang.formula)}</h1>
      <p class="example-label">Annotated example</p>
      <p class="example">${annotatedExample(card)}</p>
      <footer class="card-foot"><div class="canonical">${escapeHtml(canonicalUrl)}</div><div class="attribution">Metkagram · canonical Pattern ${escapeHtml(pattern.id)} · Source-available terms · card generated from reviewed/indexable public content</div></footer>
    </article>
  </main>
</body>
</html>
`;
}

function galleryHtml(entries) {
  const rows = entries.map((entry) => `<li><a href="${escapeHtml(entry.url)}"><strong>${escapeHtml(entry.pattern_id)}</strong> · ${entry.language.toUpperCase()}</a> <span>${escapeHtml(entry.formula)}</span></li>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Metkagram Pattern Cards</title><style>body{font:16px/1.5 system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#111}li{margin:.55rem 0}span{color:#555;margin-left:.5rem}</style></head><body><main><h1>Metkagram Pattern Cards</h1><p>Screenshot/print-ready cards generated from reviewed, search-indexable canonical Patterns. Card pages are intentionally noindex and point canonically to the learning record.</p><ul>${rows}</ul></main></body></html>\n`;
}

export function generateShareablePatternCards() {
  const content = loadContent();
  const serviceAnnotations = loadPatternAnnotations(content);
  const indexability = readJson("data/quality/pattern-indexability.json");
  const indexable = new Set((indexability.records || []).filter((record) => record.indexable).map((record) => record.pattern_id));
  const candidates = content.advancedPatterns
    .filter((pattern) => indexable.has(pattern.id))
    .filter((pattern) => LANGUAGES.every((language) => pattern.langs.some((item) => item.lang === language)))
    .sort((a, b) => scorePattern(b) - scorePattern(a) || String(a.id).localeCompare(String(b.id)));

  const selected = candidates.slice(0, CARD_COUNT);
  if (selected.length < CARD_COUNT) throw new Error(`Shareable Pattern Cards require ${CARD_COUNT} indexable bilingual Patterns; found ${selected.length}`);

  const entries = [];
  for (const pattern of selected) {
    const cards = new Map(patternToCanonicalCards(pattern, serviceAnnotations).map((card) => [card.language, card]));
    for (const language of LANGUAGES) {
      const card = cards.get(language);
      if (!card) throw new Error(`Missing canonical ${language} card for ${pattern.id}`);
      if (!card.spans?.length) throw new Error(`Shareable card ${pattern.id}:${language} has no reviewed annotation Marks`);
      const url = `/cards/${language}/${pattern.id.toLowerCase()}/`;
      write(`${url.slice(1)}index.html`, cardHtml({ pattern, card, language }));
      entries.push({
        pattern_id: pattern.id,
        set_id: pattern.set_id,
        language,
        formula: pattern.langs.find((item) => item.lang === language).formula,
        url,
        canonical_url: `${SITE_URL}${patternPath("en", pattern.id)}`,
        annotation_span_count: card.spans.length,
      });
    }
  }

  const manifest = {
    schemaVersion: 1,
    generatedFrom: "reviewed-indexable-canonical-patterns",
    patternCount: selected.length,
    cardCount: entries.length,
    languages: LANGUAGES,
    cards: entries,
  };
  write("cards/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  write("cards/index.html", galleryHtml(entries));
  console.log(`Shareable Pattern Cards: ${entries.length} cards from ${selected.length} indexable bilingual Patterns.`);
  return manifest;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) generateShareablePatternCards();
