import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { loadContent } from "../src/content.mjs";
import { auditCorpus, diagnoseLanguageField, normalizeFormulaSignature, renderCorpusAuditMarkdown } from "../src/corpus-audit.mjs";

const language = (lang, formula, example = "A valid example.") => ({ lang, formula, example, translation: "Корректный перевод.", examples: [] });
const record = (id, set_id, en, de) => ({ id, set_id, title_ru: "Учебная конструкция", langs: [language("en", en), language("de", de, "Ein gültiges Beispiel.")] });
const fixture = () => ({
  studySets: { sets: [{ id: "AAA", title_en: "First" }, { id: "BBB", title_en: "Second" }] },
  advancedPatterns: [
    record("P1", "AAA", "I need [a budget].", "Ich brauche [ein Budget]."),
    record("P2", "AAA", "I need [more people].", "Wir benötigen [Personal]."),
    record("P3", "BBB", "I need [a decision].", "Ich brauche [eine Entscheidung].")
  ]
});

test("candidate signatures replace slots while preserving meaningful lexical differences", () => {
  assert.equal(normalizeFormulaSignature(" **I  need [a budget].** "), "i need [slot].");
  assert.equal(normalizeFormulaSignature("I need [a budget]."), normalizeFormulaSignature("I need [more people]."));
  assert.notEqual(normalizeFormulaSignature("I need [a budget]."), normalizeFormulaSignature("I might need [a budget]."));
  assert.notEqual(normalizeFormulaSignature("Not [X], but [Y]."), normalizeFormulaSignature("Not because [X], but because [Y]."));
});

test("family counts remain separate for each set and language", () => {
  const report = auditCorpus(fixture());
  assert.equal(report.summary.pattern_count, 3);
  assert.deepEqual(report.summary.candidate_families_by_language, { de: 2, en: 1 });
  const first = report.sets.find((set) => set.set_id === "AAA");
  assert.equal(first.languages.en.record_count, 2);
  assert.equal(first.languages.en.candidate_family_count, 1);
  assert.deepEqual(first.languages.en.families[0].pattern_ids, ["P1", "P2"]);
  assert.equal(first.languages.de.candidate_family_count, 2);
  assert.equal(first.languages.de.largest_candidate_family_share, 0.5);
  assert.equal(report.sets[1].languages.en.record_count, 1);
  assert.match(report.methodology.interpretation, /not proven equivalent/);
  assert.match(report.methodology.human_review, /No human-review status/);
});

test("diagnostics flag narrow EN/DE agreement cues and avoid their corrected forms", () => {
  assert.equal(diagnoseLanguageField("en", "The research findings affects the next steps.")[0].code, "EN_PLURAL_AGREEMENT_CANDIDATE");
  assert.equal(diagnoseLanguageField("en", "How [the research findings] affects the next steps.")[0].status, "requires_review");
  assert.deepEqual(diagnoseLanguageField("en", "The research findings affect the next steps."), []);
  assert.deepEqual(diagnoseLanguageField("en", "The result affects the next steps."), []);
  assert.equal(diagnoseLanguageField("de", "Ich erläutere, wie [einen Förderantrag] die nächsten Schritte beeinflusst.")[0].code, "DE_ARTICLE_CASE_CANDIDATE");
  assert.equal(diagnoseLanguageField("de", "wie die Forschungsergebnisse des Teams die nächsten Schritte beeinflusst.")[0].code, "DE_PLURAL_AGREEMENT_CANDIDATE");
  assert.deepEqual(diagnoseLanguageField("de", "Ich erläutere, wie ein Förderantrag die nächsten Schritte beeinflusst."), []);
  assert.deepEqual(diagnoseLanguageField("de", "Das Argument für einen Förderantrag ist überzeugend."), []);
  assert.deepEqual(diagnoseLanguageField("de", "wie die Forschungsergebnisse des Teams die nächsten Schritte beeinflussen."), []);
});

test("Russian Latin spans are review candidates including intentional quotations, never automatic errors", () => {
  for (const value of ["Аргумент: the benefits outweigh the short-term cost.", "the benefits outweigh the short-term cost", "Обсудим цитату «the benefits outweigh the cost»."]) {
    const [finding] = diagnoseLanguageField("ru", value);
    assert.equal(finding.code, "RU_LATIN_SPAN_CANDIDATE");
    assert.equal(finding.status, "requires_review");
    assert.match(finding.explanation, /intentional quotation/);
  }
  assert.deepEqual(diagnoseLanguageField("ru", "Используйте SAP MDG и API."), []);
  assert.deepEqual(diagnoseLanguageField("ru", "SAP ERP API URL используются вместе."), []);
  assert.deepEqual(diagnoseLanguageField("en", "the benefits outweigh the short-term cost"), []);
});

test("malformed slot checks distinguish valid slots, missing boundaries and nested notation", () => {
  assert.deepEqual(diagnoseLanguageField("en", "If [condition], [result]."), []);
  assert.ok(diagnoseLanguageField("en", "If [condition, [result].").some((finding) => finding.code === "UNBALANCED_SLOT_CANDIDATE"));
  assert.ok(diagnoseLanguageField("en", "If condition], [result].").some((finding) => finding.code === "UNBALANCED_SLOT_CANDIDATE"));
  assert.ok(diagnoseLanguageField("en", "If [condition [detail]], [result].").some((finding) => finding.code === "NESTED_SLOT_CANDIDATE"));
  assert.ok(diagnoseLanguageField("en", "If [], [result].").some((finding) => finding.code === "EMPTY_SLOT_CANDIDATE"));
});

test("findings retain source language, exact field, set and stable pattern ID", () => {
  const content = fixture();
  content.advancedPatterns[0].langs[1].translation = "Аргумент: the benefits outweigh the short-term cost.";
  content.advancedPatterns[0].langs[0].examples.push({ text: "The findings affects the result.", translation_ru: "Результаты влияют на итог." });
  const report = auditCorpus(content);
  const ru = report.findings.find((finding) => finding.language === "ru");
  assert.equal(ru.source_language, "de");
  assert.equal(ru.field, "langs.de.translation");
  assert.equal(ru.pattern_id, "P1");
  assert.equal(ru.set_id, "AAA");
  assert.equal(report.findings.find((finding) => finding.language === "en").field, "langs.en.examples[0].text");
  assert.equal(report.summary.affected_pattern_count, 1);
  assert.equal(report.summary.candidate_finding_count, 2);
});

test("reports are deterministic, reflect changed text and summarize JSON without changing source", () => {
  const content = fixture();
  const original = JSON.stringify(content);
  const first = auditCorpus(content);
  assert.deepEqual(first, auditCorpus(content));
  assert.equal(JSON.stringify(content), original);
  content.advancedPatterns.reverse();
  content.studySets.sets.reverse();
  assert.deepEqual(first, auditCorpus(content));
  content.advancedPatterns[0].langs[0].example = "Another natural example.";
  assert.notEqual(first.content_sha256, auditCorpus(content).content_sha256);
  const markdown = renderCorpusAuditMarkdown(first);
  assert.match(markdown, /3 effective records across 2 sets/);
  assert.match(markdown, /do not prove grammatical equivalence/);
  assert.match(markdown, /No automatic rewriting/);
});

test("full audit includes extension sets and effective supplemental records in both languages", () => {
  const content = loadContent();
  const report = auditCorpus(content);
  assert.equal(report.summary.set_count, content.studySets.sets.length);
  assert.equal(report.summary.pattern_count, content.advancedPatterns.length);
  const extensions = JSON.parse(fs.readFileSync("data/practice-extensions.json", "utf8"));
  for (const extension of extensions.sets) {
    const set = report.sets.find((item) => item.set_id === extension.id);
    assert.ok(set, `extension ${extension.id} missing`);
    for (const lang of ["en", "de"]) {
      assert.equal(set.languages[lang].record_count, content.advancedPatterns.filter((pattern) => pattern.set_id === extension.id).length);
    }
  }
  for (const pattern of content.advancedPatterns.filter((item) => item.id.startsWith("CLF"))) {
    const set = report.sets.find((item) => item.set_id === pattern.set_id);
    for (const lang of ["en", "de"]) assert.ok(set.languages[lang].families.some((family) => family.pattern_ids.includes(pattern.id)), `${pattern.id}/${lang} missing`);
  }
});
