import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { localeLlmsLink } from "../scripts/apply-arwp.mjs";
import { RENDER_STEPS } from "../scripts/stages/render.mjs";

const ROOT = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

const profile = readJson("ai/site-profile.json");
const locales = readJson("ai/locales.json");
const searchProfile = readJson("ai/ai-search-profile.json");
const graph = readJson("knowledge/graph.json");

const REQUIRED_SEARCH_MODULES = [
  "answerPages",
  "originalResearch",
  "protocolObservatory",
  "comparisonPages",
  "conceptDefinitions",
  "claimsRegistry",
  "evidenceReceipts",
  "crawlerMatrix",
  "agentFetchLab",
  "knowledgeGraph",
  "citationVisuals",
  "openReuseAssets",
  "trustCenter",
  "correctionsLedger",
  "softwareProvenance",
  "persistentIdentifiers",
  "externalTrustSignals",
  "externalDistribution",
  "aiVisibility",
  "localization",
  "history",
];

test("site profile exposes current ARWP search discovery extensions", () => {
  assert.equal(profile.id, "metkagram-language-knowledge");
  assert.equal(profile.canonicalUrl, "https://metkagram.github.io/");
  assert.deepEqual(profile.languages, ["en", "ru", "de", "fr"]);
  assert.equal(
    profile.extensions?.["io.github.dkharlanau/localized-llms"]?.manifest,
    "https://metkagram.github.io/ai/locales.json",
  );
  assert.equal(
    profile.extensions?.["io.github.dkharlanau/ai-search-profile"]?.profile,
    "https://metkagram.github.io/ai/ai-search-profile.json",
  );
  assert.equal(profile.mcp?.servers?.[0]?.transport, "stdio");
  assert.equal(profile.mcp?.servers?.[0]?.readOnly, true);
  const distributions = profile.data?.distributions?.map((item) => item.url) || [];
  assert.ok(distributions.includes("https://metkagram.github.io/knowledge/graph.json"));
  assert.ok(distributions.includes("https://metkagram.github.io/api/v1/discovery.json"));
});

test("locale manifest preserves real interface and learning capability boundaries", () => {
  assert.equal(locales.canonicalLanguage, "en");
  assert.equal(locales.fallbackLanguage, "en");
  assert.deepEqual(locales.humanInterfaceLanguages, ["en", "ru"]);
  assert.deepEqual(locales.agentRoutingLanguages, ["en", "ru", "de", "fr"]);
  const routes = Object.fromEntries(locales.locales.map((item) => [item.language, item.llms]));
  assert.equal(routes.en, "https://metkagram.github.io/llms.txt");
  assert.equal(routes.ru, "https://metkagram.github.io/ru/llms.txt");
  assert.equal(routes.de, "https://metkagram.github.io/de/llms.txt");
  assert.equal(routes.fr, "https://metkagram.github.io/fr/llms.txt");
});

test("HTML discovery uses the locale manifest routing contract", () => {
  for (const item of locales.locales) {
    const expectedPath = new URL(item.llms).pathname;
    const link = localeLlmsLink(`<html lang="${item.language}"><head></head></html>`);
    assert.ok(link.includes(`href="${expectedPath}"`), `${item.language} must advertise ${expectedPath}`);
    assert.ok(link.includes(`hreflang="${item.language}"`), `${item.language} must preserve its routing language`);
  }

  const regionalGerman = localeLlmsLink('<html lang="de-DE"><head></head></html>');
  assert.ok(regionalGerman.includes('href="/de/llms.txt"'));
  assert.ok(regionalGerman.includes('hreflang="de"'));

  const unsupported = localeLlmsLink('<html lang="it"><head></head></html>');
  assert.ok(unsupported.includes('href="/llms.txt"'));
  assert.ok(unsupported.includes('hreflang="en"'));
});

test("AI search profile is complete and intentionally avoids synthetic readiness claims", () => {
  assert.equal(searchProfile.profileVersion, "0.1");
  for (const module of REQUIRED_SEARCH_MODULES) assert.ok(searchProfile.modules?.[module], `missing search module ${module}`);
  for (const guardrail of [
    "noRankingClaimsWithoutEvidence",
    "separateOwnedFromIndependentEvidence",
    "preserveNegativeResults",
    "canonicalTechnicalSemantics",
    "noFabricatedAdoption",
    "noReadinessScore",
  ]) assert.equal(searchProfile.guardrails?.[guardrail], true, `${guardrail} must remain enabled`);
  assert.equal(searchProfile.modules.localization.status, "active");
  assert.equal(searchProfile.modules.knowledgeGraph.status, "active");
  assert.equal(searchProfile.surfaces.knowledgeGraph.status, "active");
});

test("knowledge graph publishes stable Metkagram entities and vocabulary", () => {
  assert.equal(graph["@context"]?.["@vocab"], "https://schema.org/");
  assert.ok(Array.isArray(graph["@graph"]));
  const ids = new Set(graph["@graph"].map((node) => node["@id"]));
  for (const id of [
    "https://metkagram.github.io/#website",
    "https://metkagram.github.io/#project",
    "https://metkagram.github.io/#practice",
    "https://metkagram.github.io/#lens",
    "https://metkagram.github.io/#catalog",
    "https://metkagram.github.io/#vocabulary",
    "https://metkagram.github.io/#term-frame",
    "https://metkagram.github.io/#term-move",
    "https://metkagram.github.io/#term-bridge",
  ]) assert.ok(ids.has(id), `missing graph entity ${id}`);
});

test("ARWP publication is the final HTML-producing render step", () => {
  assert.equal(RENDER_STEPS.at(-1), "scripts/apply-arwp.mjs");
  const source = fs.readFileSync(path.join(ROOT, "scripts/apply-arwp.mjs"), "utf8");
  assert.match(source, /\/ai\/site-profile\.json/);
  assert.match(source, /\/ai\/ai-search-profile\.json/);
  assert.match(source, /\/knowledge\/graph\.json/);
  assert.match(source, /hreflang/);
});
