// Reproducible diagnostics for the effective corpus returned by loadContent().
// Signatures and language checks identify review candidates, never reviewed
// language quality, grammatical equivalence, or learning efficacy.
import crypto from "node:crypto";

export const CORPUS_AUDIT_SCHEMA_VERSION = 1;
export const PRESERVATION_SCHEMA_VERSION = 1;

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const sorted = (items) => [...items].sort(compare);
const textValue = (value) => String(value ?? "").normalize("NFKC").replaceAll("**", "");

export function normalizeFormulaSignature(formula) {
  return textValue(formula)
    .replace(/\[[^\[\]]*\]/gu, "[slot]")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

function assert(condition, message) {
  if (!condition) throw new Error(`Curriculum preservation: ${message}`);
}

// Keep this baseline append-only: editorial corrections and new records do not
// require refreshing it. Existing IDs, memberships and slugs remain protected.
export function createCurriculumSnapshot(content, registry, { sourceRevision } = {}) {
  const sets = {};
  const patternSlugs = {};
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
  for (const set of [...content.studySets.sets].sort((a, b) => compare(a.id, b.id))) {
    assert(!Object.hasOwn(sets, set.id), `duplicate set ${set.id}`);
    const slug = registry.studySets?.[set.id];
    assert(typeof slug === "string" && slugPattern.test(slug), `missing or invalid set slug ${set.id}`);
    sets[set.id] = { slug, pattern_ids: [] };
  }
  for (const pattern of [...content.advancedPatterns].sort((a, b) => compare(a.id, b.id))) {
    assert(Object.hasOwn(sets, pattern.set_id), `unknown set ${pattern.set_id} for ${pattern.id}`);
    assert(!Object.hasOwn(patternSlugs, pattern.id), `duplicate pattern ${pattern.id}`);
    const core = registry.patterns?.[pattern.id];
    assert(typeof core === "string" && slugPattern.test(core), `missing or invalid pattern slug ${pattern.id}`);
    patternSlugs[pattern.id] = `${core}-${pattern.id.toLowerCase()}`;
    sets[pattern.set_id].pattern_ids.push(pattern.id);
  }
  assert(Object.keys(sets).length && Object.keys(patternSlugs).length, "snapshot must not be empty");
  return {
    schemaVersion: PRESERVATION_SCHEMA_VERSION,
    ...(sourceRevision ? { sourceRevision } : {}),
    policy: "Existing set IDs, pattern IDs, set memberships and public slugs are permanent; additions are allowed.",
    sets,
    patternSlugs
  };
}

function validateBaseline(baseline) {
  assert(baseline?.schemaVersion === PRESERVATION_SCHEMA_VERSION, "unsupported baseline schemaVersion");
  assert(baseline.sets && Object.keys(baseline.sets).length, "baseline sets must not be empty");
  assert(baseline.patternSlugs && Object.keys(baseline.patternSlugs).length, "baseline patternSlugs must not be empty");
  const seen = new Set();
  for (const [setId, set] of Object.entries(baseline.sets)) {
    assert(typeof set.slug === "string" && set.slug, `baseline set ${setId} has no slug`);
    assert(Array.isArray(set.pattern_ids) && set.pattern_ids.length, `baseline set ${setId} has no members`);
    for (const id of set.pattern_ids) {
      assert(!seen.has(id), `baseline pattern ${id} belongs to multiple sets or appears twice`);
      assert(typeof baseline.patternSlugs[id] === "string" && baseline.patternSlugs[id], `baseline pattern ${id} has no slug`);
      seen.add(id);
    }
  }
  assert(seen.size === Object.keys(baseline.patternSlugs).length, "baseline membership and patternSlugs disagree");
}

export function checkCurriculumPreservation(content, registry, baseline) {
  validateBaseline(baseline);
  const current = createCurriculumSnapshot(content, registry);
  const currentMembership = new Map(Object.entries(current.sets)
    .flatMap(([setId, set]) => set.pattern_ids.map((id) => [id, setId])));
  const errors = [];
  for (const [setId, set] of Object.entries(baseline.sets)) {
    const next = current.sets[setId];
    if (!next) errors.push({ code: "SET_REMOVED", set_id: setId });
    else if (next.slug !== set.slug) errors.push({ code: "SET_SLUG_CHANGED", set_id: setId, expected: set.slug, actual: next.slug });
    for (const id of set.pattern_ids) {
      const membership = currentMembership.get(id);
      if (!membership) errors.push({ code: "PATTERN_REMOVED", pattern_id: id, set_id: setId });
      else if (membership !== setId) errors.push({ code: "MEMBERSHIP_CHANGED", pattern_id: id, expected: setId, actual: membership });
    }
  }
  for (const [id, slug] of Object.entries(baseline.patternSlugs)) {
    if (current.patternSlugs[id] && current.patternSlugs[id] !== slug) {
      errors.push({ code: "PATTERN_SLUG_CHANGED", pattern_id: id, expected: slug, actual: current.patternSlugs[id] });
    }
  }
  return {
    passed: errors.length === 0,
    baseline_source_revision: baseline.sourceRevision ?? null,
    protected_set_count: Object.keys(baseline.sets).length,
    protected_pattern_count: Object.keys(baseline.patternSlugs).length,
    added_set_ids: sorted(Object.keys(current.sets).filter((id) => !Object.hasOwn(baseline.sets, id))),
    added_pattern_ids: sorted(Object.keys(current.patternSlugs).filter((id) => !Object.hasOwn(baseline.patternSlugs, id))),
    errors
  };
}

function languageFields(pattern) {
  const fields = [];
  for (const key of ["title_ru", "metaphor_ru"]) {
    if (pattern[key]) fields.push({ language: "ru", source_language: null, field: key, text: pattern[key] });
  }
  for (const lang of pattern.langs ?? []) {
    const prefix = `langs.${lang.lang}`;
    for (const key of ["formula", "example"]) {
      if (lang[key]) fields.push({ language: lang.lang, source_language: lang.lang, field: `${prefix}.${key}`, text: lang[key] });
    }
    if (lang.translation) fields.push({ language: "ru", source_language: lang.lang, field: `${prefix}.translation`, text: lang.translation });
    for (const [index, example] of (lang.examples ?? []).entries()) {
      if (example.text) fields.push({ language: lang.lang, source_language: lang.lang, field: `${prefix}.examples[${index}].text`, text: example.text });
      if (example.translation_ru) fields.push({ language: "ru", source_language: lang.lang, field: `${prefix}.examples[${index}].translation_ru`, text: example.translation_ru });
    }
  }
  return fields;
}

// Deliberately narrow lexical checks: these are candidates, not a grammar engine.
export function diagnoseLanguageField(language, value) {
  const text = textValue(value);
  const unmarked = text.replace(/[\[\]]/gu, "");
  const findings = [];
  const add = (code, match, explanation) => findings.push({ code, match, explanation, status: "requires_review" });
  if (language === "en") {
    for (const match of unmarked.matchAll(/\b(findings|results|requirements|figures|costs|steps|changes|delays|risks|employees|suppliers|customers)\s+(affects|is|was|has|requires|causes|indicates|shows|suggests|remains)\b/giu)) {
      add("EN_PLURAL_AGREEMENT_CANDIDATE", match[0], "A listed plural noun is immediately followed by a singular verb form; check the full sentence and intended subject.");
    }
  }
  if (language === "de") {
    const article = unmarked.match(/\bwie\s+einen\s+(?:Förderantrag|Plan\s+für\s+den\s+Nahverkehr)\s+die\s+nächsten\s+Schritte\s+beeinflusst\b/iu);
    if (article) add("DE_ARTICLE_CASE_CANDIDATE", article[0], "In this narrow scaffold, verify whether the phrase after wie is the subject and needs nominative ein; German word order alone does not establish its role.");
    const agreement = unmarked.match(/\bdie\s+Forschungsergebnisse\s+des\s+Teams\s+die\s+nächsten\s+Schritte\s+beeinflusst\b/iu);
    if (agreement) add("DE_PLURAL_AGREEMENT_CANDIDATE", agreement[0], "Check plural beeinflussen for Forschungsergebnisse in this scaffold.");
  }
  if (language === "ru") {
    for (const match of text.matchAll(/\b[A-Za-z]+(?:[-’'][A-Za-z]+)*(?:\s+[A-Za-z]+(?:[-’'][A-Za-z]+)*){3,}\b/gu)) {
      const lowerWords = match[0].split(/\s+/u).filter((word) => /^[a-z]/u.test(word));
      if (lowerWords.length >= 2) add("RU_LATIN_SPAN_CANDIDATE", match[0], "Four or more Latin-script words in a Russian-language field may be an untranslated span or an intentional quotation; review in context.");
    }
  }
  let depth = 0;
  let unbalanced = false;
  let nested = false;
  for (const char of text) {
    if (char === "[") { depth += 1; if (depth > 1) nested = true; }
    if (char === "]") { if (depth === 0) unbalanced = true; else depth -= 1; }
  }
  if (unbalanced || depth) add("UNBALANCED_SLOT_CANDIDATE", text, "Opening and closing square brackets do not balance; inspect the intended slot boundaries.");
  if (nested) add("NESTED_SLOT_CANDIDATE", text, "Nested square brackets need review; the signature algorithm does not parse nested slots.");
  if (/\[\s*\]/u.test(text)) add("EMPTY_SLOT_CANDIDATE", "[]", "An empty slot may be missing its label.");
  return findings;
}

function summarizeFamilies(patterns, language) {
  const families = new Map();
  for (const pattern of patterns) {
    const lang = pattern.langs?.find((item) => item.lang === language);
    if (!lang) continue;
    const signature = normalizeFormulaSignature(lang.formula);
    if (!families.has(signature)) families.set(signature, []);
    families.get(signature).push(pattern.id);
  }
  const items = [...families].map(([signature, ids]) => ({ signature, record_count: ids.length, pattern_ids: sorted(ids) }))
    .sort((a, b) => b.record_count - a.record_count || compare(a.signature, b.signature));
  const recordCount = items.reduce((sum, item) => sum + item.record_count, 0);
  return {
    record_count: recordCount,
    candidate_family_count: items.length,
    largest_candidate_family_size: items[0]?.record_count ?? 0,
    largest_candidate_family_share: recordCount ? Number((items[0].record_count / recordCount).toFixed(6)) : 0,
    families: items
  };
}

export function auditCorpus(content, { preservation } = {}) {
  const patterns = [...content.advancedPatterns].sort((a, b) => compare(a.id, b.id));
  const languages = sorted(new Set(patterns.flatMap((pattern) => (pattern.langs ?? []).map((lang) => lang.lang))));
  const findings = [];
  for (const pattern of patterns) {
    for (const field of languageFields(pattern)) {
      for (const finding of diagnoseLanguageField(field.language, field.text)) {
        findings.push({ pattern_id: pattern.id, set_id: pattern.set_id, ...field, ...finding });
      }
    }
  }
  const sets = [...content.studySets.sets].sort((a, b) => compare(a.id, b.id)).map((set) => {
    const members = patterns.filter((pattern) => pattern.set_id === set.id);
    return {
      set_id: set.id,
      title_en: set.title_en ?? set.id,
      record_count: members.length,
      languages: Object.fromEntries(languages.map((language) => [language, summarizeFamilies(members, language)]))
    };
  });
  const findingCounts = {};
  for (const finding of findings) findingCounts[finding.code] = (findingCounts[finding.code] ?? 0) + 1;
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify({
    set_ids: sets.map((set) => set.set_id),
    records: patterns.map((pattern) => ({ id: pattern.id, set_id: pattern.set_id, fields: languageFields(pattern) }))
  })).digest("hex");
  return {
    schemaVersion: CORPUS_AUDIT_SCHEMA_VERSION,
    source: "loadContent(): base shards + reasoning-frame merge + practice extensions + quality overrides",
    content_sha256: fingerprint,
    methodology: {
      signature: "NFKC, remove bold markers, replace each non-nested square-bracket slot with [slot], collapse whitespace and lowercase; preserve wording and punctuation outside slots.",
      interpretation: "Candidate families are lexical templates for editorial inspection, not proven equivalent constructions. Language findings require review and are not automatic error counts.",
      coverage: "Every effective set and target language is counted separately. Russian title, note and translation fields are also inspected. Narrow lexical checks do not establish overall language quality.",
      human_review: "No human-review status, CEFR validation or learning-efficacy conclusion is inferred by this audit."
    },
    summary: {
      set_count: sets.length,
      pattern_count: patterns.length,
      target_languages: languages,
      candidate_families_by_language: Object.fromEntries(languages.map((language) => [language, summarizeFamilies(patterns, language).candidate_family_count])),
      candidate_finding_count: findings.length,
      affected_pattern_count: new Set(findings.map((finding) => finding.pattern_id)).size,
      finding_counts_by_code: Object.fromEntries(Object.entries(findingCounts).sort(([a], [b]) => compare(a, b)))
    },
    ...(preservation ? { preservation } : {}),
    sets,
    findings
  };
}

const markdownCell = (value) => String(value).replaceAll("|", "\\|").replace(/\s+/gu, " ").trim();

export function renderCorpusAuditMarkdown(report, { maxSetRows = 20, maxFindingRows = 20 } = {}) {
  const lines = [
    "# Corpus quality audit", "",
    `${report.summary.pattern_count} effective records across ${report.summary.set_count} sets. Target languages: ${report.summary.target_languages.join(", ")}.`, "",
    `Content fingerprint: \`${report.content_sha256}\`.`, "",
    "These counts describe the effective merged corpus. Candidate formula families replace slot contents; they do not prove grammatical equivalence or instructional diversity. Diagnostics require editorial review and do not certify quality or efficacy.", ""
  ];
  if (report.preservation) {
    lines.push(`Preservation: **${report.preservation.passed ? "PASS" : "FAIL"}**; ${report.preservation.protected_set_count} sets and ${report.preservation.protected_pattern_count} pattern identities protected; ${report.preservation.added_set_ids.length} new sets and ${report.preservation.added_pattern_ids.length} new patterns.`, "");
    for (const error of report.preservation.errors) lines.push(`- ${error.code}: ${error.pattern_id ?? error.set_id}${error.expected ? ` (${error.expected} → ${error.actual})` : ""}`);
    if (report.preservation.errors.length) lines.push("");
  }
  lines.push("## Largest repeated candidate families", "", "| Set | Language | Records | Candidate families | Largest family |", "|---|---|---:|---:|---:|");
  const rows = report.sets.flatMap((set) => Object.entries(set.languages).map(([language, data]) => ({ set, language, data })))
    .sort((a, b) => b.data.largest_candidate_family_size - a.data.largest_candidate_family_size || compare(a.set.set_id, b.set.set_id) || compare(a.language, b.language));
  for (const { set, language, data } of rows.slice(0, maxSetRows)) {
    lines.push(`| ${markdownCell(set.set_id)} | ${language} | ${data.record_count} | ${data.candidate_family_count} | ${data.largest_candidate_family_size} (${(data.largest_candidate_family_share * 100).toFixed(1)}%) |`);
  }
  lines.push("", "Full per-set and per-language families, signatures and stable member IDs are in the JSON report.", "", "## Language and slot review candidates", "",
    `${report.summary.candidate_finding_count} field-level candidates affect ${report.summary.affected_pattern_count} records. Repeated issues in separate translations/examples are counted separately; they are not independent confirmed errors.`, "",
    "| Diagnostic | Candidate fields |", "|---|---:|");
  for (const [code, count] of Object.entries(report.summary.finding_counts_by_code)) lines.push(`| ${code} | ${count} |`);
  if (!report.findings.length) lines.push("| No candidates from these narrow checks | 0 |");
  lines.push("", "### Sample for review", "", "| Set / stable ID | Field | Diagnostic | Matched text |", "|---|---|---|---|");
  // Show different records before multiple repetitions from the same record.
  const sample = new Map();
  for (const finding of report.findings) if (!sample.has(finding.pattern_id)) sample.set(finding.pattern_id, finding);
  const firstPerPattern = [...sample.values()];
  for (const finding of firstPerPattern.slice(0, maxFindingRows)) {
    lines.push(`| ${finding.set_id} / ${finding.pattern_id} | ${markdownCell(finding.field)} | ${finding.code} | ${markdownCell(finding.match).slice(0, 180)} |`);
  }
  lines.push("", "Correct confirmed language problems in source records, preserve IDs/membership/slugs, and rerun. Review intentional quotations and slot notation before changing them. No automatic rewriting or review-status promotion is performed.", "");
  return lines.join("\n");
}
