import { workplacePractice, validateWorkplacePractice } from "../src/workplace-practice.mjs";
// Build stage 2 — validate (see ARCHITECTURE.md "Build pipeline").
//
// Validates the canonical semantic state before any rendering happens:
// content, annotations, release/rights metadata, language capabilities and
// every feature source dataset. This script must never read rendered output —
// the validate stage runs before any page exists (tests/build-stages.test.mjs
// enforces the no-rendered-output rule).
import fs from "node:fs";
import { checkCurriculumPreservation } from "../src/corpus-audit.mjs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { buildDomainModel } from "../src/domain-model.mjs";
import { loadDiscoveryTopicExtensions, loadDiscoveryTopics } from "../src/discovery-pages.mjs";
import {
  annotationLanguages,
  interfaceLocales,
  languageRegistry,
  learningLanguages,
  publicLanguageMatrix,
  translationLocales,
} from "../src/language-registry.mjs";
import { validatePublicLearningRules } from "../src/public-learning.mjs";
import { citationCff, RELEASE, RIGHTS_EFFECTIVE_DATE, rightsJson } from "../src/release.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";
import {
  validateChoiceDrills,
  validateContrastExtensions,
  validateContrastLibrary,
  validateLanguagePilotFrames,
  validateLearningEventSchema,
  validatePartnershipPayload,
  validateReasoningPacks,
  validateRussianSpeakerErrors,
  validateTeacherExportSources,
} from "../src/source-validation.mjs";
import { migrateAnnotations } from "./annotations.mjs";
import { loadPatternAnnotations } from "./build.mjs";

const ROOT = process.cwd();
const readSourceJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${name}`);
  } catch (error) {
    throw new Error(`validate stage failed — ${name}: ${error.message}`, { cause: error });
  }
}

function main() {
  let content;
  check("canonical content (data/, src/content.mjs)", () => {
    content = loadContent();
    validateWorkplacePractice(workplacePractice, content.advancedPatterns);
  });
  const patternMap = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));

  check("canonical annotation migration", () => {
    const result = migrateAnnotations();
    if (result.report.errors.length) throw new Error(`${result.report.errors.length} invalid canonical annotation records`);
  });
  check("practice annotation layer", () => {
    loadPatternAnnotations(content);
  });

  check("release and rights state (src/release.mjs)", () => {
    if (RELEASE.rights.defaultRights !== "all-rights-reserved") throw new Error("current rights default must remain all-rights-reserved");
    if (/CC BY-NC/i.test(`${RELEASE.rights.status} ${RELEASE.rights.label}`)) {
      throw new Error("CC BY-NC must not appear as the current rights status; it is historical only");
    }
    if (RELEASE.rights.historicalLicense?.license !== "CC BY-NC 4.0" || RELEASE.rights.historicalLicense?.before !== RIGHTS_EFFECTIVE_DATE) {
      throw new Error("historical CC BY-NC 4.0 grant must stay recorded with its effective date");
    }
    if (RELEASE.canonicalUrl !== SITE_URL) throw new Error("release canonical URL drifted from src/site.mjs");
    if (RELEASE.citation.dateReleased !== SITE_RELEASE_DATE) throw new Error("citation date drifted from SITE_RELEASE_DATE");
    if (RELEASE.citation.url !== `${SITE_URL}/`) throw new Error("citation URL drifted from the canonical site URL");
  });
  check("generated release artifacts in sync", () => {
    const citation = fs.readFileSync(path.join(ROOT, "CITATION.cff"), "utf8");
    if (citation !== citationCff()) throw new Error("CITATION.cff drifted from src/release.mjs (source stage regenerates it)");
    const rights = fs.readFileSync(path.join(ROOT, "public", "rights.json"), "utf8");
    if (rights !== `${JSON.stringify(rightsJson(), null, 2)}\n`) throw new Error("public/rights.json drifted from src/release.mjs");
  });

  check("language capability registry", () => {
    const expect = (actual, wanted, label) => {
      if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label}: expected ${wanted}, found ${actual}`);
    };
    expect(interfaceLocales, ["en", "ru"], "interface locales");
    expect(learningLanguages, ["en", "de", "fr"], "learning languages");
    expect(translationLocales, ["ru"], "translation locales");
    expect(annotationLanguages, ["en", "de"], "annotation languages");
    const french = languageRegistry.fr;
    if (!french || french.status !== "pilot" || french.roles.annotation) {
      throw new Error("French must stay a bounded Frame-only pilot without an annotation claim");
    }
    publicLanguageMatrix();
  });

  check("contrast library (data/contrasts.json)", () => {
    validateContrastLibrary(readSourceJson("data/contrasts.json"), patternMap);
  });
  const contrasts = readSourceJson("data/contrasts.json");
  check("contrast extensions (data/contrast-extensions.json)", () => {
    validateContrastExtensions(readSourceJson("data/contrast-extensions.json"), patternMap, contrasts.items.map((item) => item.id));
  });
  let drills;
  check("choice drills (data/choice-drills.json)", () => {
    drills = readSourceJson("data/choice-drills.json");
    validateChoiceDrills(drills, contrasts, patternMap);
  });
  check("reasoning packs + teacher export sources", () => {
    const packs = readSourceJson("data/reasoning-packs.json");
    const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));
    const drillMap = new Map(drills.items.map((item) => [item.id, item]));
    validateReasoningPacks(packs, patternMap, contrastMap, drillMap);
    validateTeacherExportSources(packs, patternMap, contrastMap, drillMap);
  });
  check("russian-speaker error map", () => {
    validateRussianSpeakerErrors(readSourceJson("data/russian-speaker-errors.json"), patternMap);
  });
  check("public learning rules", () => {
    validatePublicLearningRules(new Set(content.advancedPatterns.map((pattern) => pattern.id)));
  });
  check("discovery topics (base + extensions)", () => {
    const baseTopics = loadDiscoveryTopics(content);
    loadDiscoveryTopicExtensions(content, baseTopics);
  });
  check("partnership opportunities", () => {
    validatePartnershipPayload(readSourceJson("data/partnership-opportunities.json"));
  });

  const pilotExtensions = [];
  check("language pilot frames (data/language-pilots/)", () => {
    const directory = path.join(ROOT, "data", "language-pilots");
    if (!fs.existsSync(directory)) return;
    for (const name of fs.readdirSync(directory).filter((entry) => entry.endsWith(".json")).sort()) {
      const file = path.join(directory, name);
      const value = JSON.parse(fs.readFileSync(file, "utf8"));
      validateLanguagePilotFrames(file, value);
      pilotExtensions.push(...value);
    }
  });
  check("domain model construction", () => {
    buildDomainModel(content.advancedPatterns, { frameExtensions: pilotExtensions });
  });
  check("learning event schema", () => {
    validateLearningEventSchema(readSourceJson("data/learning-event.schema.json"));
  });
  check("evaluation fixtures present", () => {
    for (const relative of [
      "data/evaluation/reasoning-intents.json",
      "data/evaluation/pattern-lens-cases.json",
      "data/evaluation/pattern-lens-hard-cases.json",
      "data/evaluation/public-learning-links.json",
      "data/research/h1-cue-utility-v1.json",
    ]) {
      const value = readSourceJson(relative);
      if (!value || (Array.isArray(value) && !value.length)) throw new Error(`${relative} is missing or empty`);
    }
  });

  check("permanent curriculum preservation", () => {
    const result = checkCurriculumPreservation(content, readSourceJson("data/seo-slugs.json"), readSourceJson("data/curriculum-preservation.json"));
    if (!result.passed) throw new Error(JSON.stringify(result.errors));
  });
  console.log(`Validate stage passed: ${passed} checks over canonical source data.`);
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main();
}
