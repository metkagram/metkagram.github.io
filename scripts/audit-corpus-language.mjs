// Read-only editorial inventory. LanguageTool findings are candidates, not edits.
// Run: node scripts/audit-corpus-language.mjs [--endpoint=http://127.0.0.1:8081]
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/content.mjs';
import { cleanMarkedText } from '../src/annotation-schema.mjs';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'reports', 'corpus-language-audit');
const languages = new Set(['en', 'de', 'ru']);
const inventory = new Map();
const skip = /^(?:id|pattern_id|source_ids?|set_ids?|related|slug|category|tags|formula|formulas|url|href|source|sources|license|rights|schema|schema_version|schemaVersion|version|text_span|spans|legacy|gen|quality|metadata|annotations|chunkList|userWords|translated_text)$/;
const prose = /^(?:title|heading|description|intro|text|example|translation|translations|explanation|paragraphs?|body|takeaway|caption|prompt|question|answer|feedback|rationale|hint|comment|label|summary|situation|goal|when_to_use|common_mistake|meaning|why|note|notes|correct|incorrect|before|after|alternatives|metaphor)(?:_(?:en|de|ru))?$/;
function add(language, text, location, kind = 'prose') {
  if (!languages.has(language) || typeof text !== 'string') return;
  const clean = cleanMarkedText(text).trim();
  if (clean.length < 8 || !/\s/u.test(clean)) return;
  const key = `${language}\u0000${clean}`;
  if (!inventory.has(key)) inventory.set(key, { id: `t${String(inventory.size + 1).padStart(6, '0')}`, language, text: clean, locations: [] });
  inventory.get(key).locations.push({ location, kind });
}
function walk(value, location, inheritedLanguage = 'en', textContext = false) {
  if (typeof value === 'string') { if (textContext) add(inheritedLanguage, value, location); return; }
  if (Array.isArray(value)) { value.forEach((x, i) => walk(x, `${location}/${i}`, inheritedLanguage, textContext)); return; }
  if (!value || typeof value !== 'object') return;
  const language = languages.has(value.lang) ? value.lang : languages.has(value.language) ? value.language : inheritedLanguage;
  for (const [key, child] of Object.entries(value)) {
    if (skip.test(key)) continue;
    const suffix = key.match(/_(en|de|ru)$/)?.[1];
    const nextLanguage = languages.has(key) ? key : suffix || (key === 'translation' ? 'ru' : language);
    walk(child, `${location}/${key}`, nextLanguage, textContext || prose.test(key) || languages.has(key));
  }
}
const content = loadContent();
for (const pattern of content.advancedPatterns) walk(pattern, `pattern:${pattern.id}`);
let legacySentences = 0;
for (const [target, collections] of Object.entries(content.collections)) {
  const language = target === 'german' ? 'de' : 'en';
  for (const [collection, group] of Object.entries(collections)) for (const doc of group.documents) {
    const prefix = `document:${target}/${collection}/${doc.id}`;
    add(language, doc.title, `${prefix}/title`, 'title');
    add(language, doc.comment, `${prefix}/comment`);
    for (const sentence of doc.annotations) {
      legacySentences++;
      add(language, sentence.original_text, `${prefix}/${sentence.id}/original_text`, 'annotated-sentence');
      for (const [locale, translation] of Object.entries(sentence.translations || {})) add(locale, translation, `${prefix}/${sentence.id}/translations/${locale}`, 'translation');
      if (!sentence.translations?.ru && /[А-Яа-яЁё]/u.test(sentence.translated_text || '')) add('ru', sentence.translated_text, `${prefix}/${sentence.id}/translated_text`, 'translation');
    }
  }
}
for (const file of fs.readdirSync(path.join(ROOT, 'data', 'method-guides')).filter(x => x.endsWith('.json')).sort()) {
  walk(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'method-guides', file), 'utf8')), `data/method-guides/${file}`);
}
for (const file of ['study-sets.json', 'practice-extensions.json', 'choice-drills.json', 'contrasts.json', 'contrast-extensions.json', 'reasoning-packs.json', 'russian-speaker-errors.json', 'discovery-topics.json', 'discovery-topics-extension.json', 'discovery-topics-extension-thinking-2.json']) {
  walk(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file), 'utf8')), `data/${file}`);
}
const records = [...inventory.values()];
const summary = { source_revision: process.env.GITHUB_SHA || null, patterns: content.advancedPatterns.length, practice_references: content.advancedPatterns.reduce((n, p) => n + p.langs.reduce((m, l) => m + 1 + (l.examples || []).length, 0), 0), legacy_sentences: legacySentences, unique_texts: records.length, by_language: Object.fromEntries([...languages].map(l => [l, records.filter(r => r.language === l).length])), limitations: ['Formulas and legacy parsing notes require separate editorial review.', 'Quoted mistakes and technical/domain terms can produce intentional or false-positive findings.', 'Absence of rule-based findings does not certify linguistic correctness.'] };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'inventory.json'), JSON.stringify({ summary, records }, null, 2) + '\n');
console.log(JSON.stringify(summary));
const endpoint = process.argv.find(a => a.startsWith('--endpoint='))?.slice('--endpoint='.length);
if (endpoint) {
  const url = new URL(endpoint);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Use a local LanguageTool server; this command does not send corpus text to third-party cloud APIs.');
  const findings = [];
  let checked = 0, software = null;
  for (const language of languages) {
    const selected = records.filter(r => r.language === language);
    for (let start = 0; start < selected.length;) {
      const batch = []; let text = '';
      while (start < selected.length && (text.length + selected[start].text.length < 14000 || !batch.length)) {
        const record = selected[start++];
        if (text) text += '\n\n';
        batch.push({ record, start: text.length, end: text.length + record.text.length });
        text += record.text;
      }
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/v2/check`, { method: 'POST', body: new URLSearchParams({ language: {en:'en-US',de:'de-DE',ru:'ru'}[language], text }), signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`LanguageTool ${response.status}: ${await response.text()}`);
      const result = await response.json(); software = result.software;
      for (const match of result.matches || []) {
        const source = batch.find(r => r.start <= match.offset && match.offset < r.end);
        if (!source) continue;
        findings.push({ id: source.record.id, language, text: source.record.text, offset: match.offset - source.start, length: match.length, rule: match.rule.id, issue_type: match.rule.issueType, category: match.rule.category?.id, message: match.message, replacements: match.replacements.slice(0, 5).map(r => r.value), locations: source.record.locations });
      }
      checked += batch.length;
      fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify({ ...summary, checked, software, findings }, null, 2) + '\n');
      console.log(`Checked ${checked}/${records.length}; candidate findings ${findings.length}`);
    }
  }
}
