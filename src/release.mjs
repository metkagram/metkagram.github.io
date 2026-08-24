// Canonical release and rights state for Metkagram.
//
// This module is the single source of truth for the current public release:
// canonical URL, release date, product/dataset versions, rights/licensing state,
// citation metadata, language capabilities and the public evidence boundary.
//
// Site pages, API manifests, MCP specs, CITATION.cff, rights.json and
// distribution exports must derive from this module (or from the leaf sources it
// composes: site.mjs, provenance.mjs, language-registry.mjs) instead of keeping
// their own copies. Validation lives in tests/release-metadata.test.mjs.

import { SITE_RELEASE_DATE, SITE_URL } from "./site.mjs";
import { ATTRIBUTION, getDatasetVersion, getProductVersion } from "./provenance.mjs";
import { languageRegistry, publicLanguageMatrix } from "./language-registry.mjs";

export const RIGHTS_EFFECTIVE_DATE = "2026-08-17";

// Historical fact: revisions published before RIGHTS_EFFECTIVE_DATE were offered
// under CC BY-NC 4.0. This must remain historically accurate; it is not the
// current license and must never be presented as one.
export const HISTORICAL_LICENSE = Object.freeze({
  before: RIGHTS_EFFECTIVE_DATE,
  license: "CC BY-NC 4.0",
  note: "Rights already granted for copies received under prior CC BY-NC 4.0 terms are not revoked.",
});

// The product version reader lives in provenance.mjs (single implementation);
// re-exported here so consumers can take everything from the canonical module.
export { getProductVersion };

// Learning languages with a published pattern corpus. French stays a bounded
// Frame-only pilot (status "pilot") and is deliberately excluded until its
// capability status changes deliberately in language-registry.mjs.
export function corpusLanguages(registry = languageRegistry) {
  return Object.values(registry)
    .filter((language) => language.roles?.learning && language.status === "stable")
    .map((language) => language.code);
}

export const RELEASE = Object.freeze({
  schemaVersion: 1,
  project: "Metkagram",
  canonicalUrl: SITE_URL,
  releaseDate: SITE_RELEASE_DATE,
  rights: Object.freeze({
    status: ATTRIBUTION.rights_status,
    label: ATTRIBUTION.license,
    effectiveDate: RIGHTS_EFFECTIVE_DATE,
    defaultRights: "all-rights-reserved",
    licenseUrl: ATTRIBUTION.license_url,
    termsUrl: ATTRIBUTION.terms_url,
    rightsUrl: ATTRIBUTION.rights_url,
    rightsNotice: `${SITE_URL}/LICENSE`,
    humanReadableTerms: Object.freeze({
      en: `${SITE_URL}/en/licensing/`,
      ru: `${SITE_URL}/ru/licensing/`,
    }),
    historicalLicense: HISTORICAL_LICENSE,
  }),
  citation: Object.freeze({
    title: "Metkagram: Visual Language Patterns and Annotated Learning Resources",
    type: "dataset",
    authors: Object.freeze([Object.freeze({ familyNames: "Kharlanau", givenNames: "Dzmitryi" })]),
    dateReleased: SITE_RELEASE_DATE,
    url: `${SITE_URL}/`,
    repositoryCode: ATTRIBUTION.source_repository,
    keywords: Object.freeze([
      "language learning",
      "natural language processing",
      "English",
      "German",
      "sentence patterns",
      "linguistic annotation",
    ]),
  }),
  languages: publicLanguageMatrix(),
  // Evidence boundary: method descriptions, design rationale and hypotheses are
  // not evidence. Public evaluation artifacts are deterministic regression
  // fixtures, not studies of learning outcomes.
  evidence: Object.freeze({
    efficacyClaims: "none",
    publicArtifacts: "deterministic regression benchmarks and evaluation fixtures",
    policyUrl: `${SITE_URL}/en/research/`,
  }),
});

export function releaseState() {
  return {
    ...RELEASE,
    productVersion: getProductVersion(),
    datasetVersion: getDatasetVersion(),
  };
}

// Canonical citation strings. Every surface (API attribution policy, AI page,
// cite pages, distribution cards) uses these instead of local variants.
export function citationFormats() {
  const year = RELEASE.releaseDate.slice(0, 4);
  const version = getProductVersion();
  return {
    // Template for downstream tools: keep the {canonical_url} placeholder.
    web: `${ATTRIBUTION.attribution_text}. Available at {canonical_url}.`,
    // Concrete citation for the published dataset as a whole.
    publication: `Metkagram. Visual language patterns and annotated learning resources. ${SITE_URL}/. Dataset version ${getDatasetVersion()}.`,
    academic: `Kharlanau, D. (${year}). ${RELEASE.citation.title} (version ${version}) [Dataset]. ${SITE_URL}/`,
    ai_answer: "This answer uses data from Metkagram (https://metkagram.github.io/). See the source page for the full pattern and attribution.",
    application: `"${ATTRIBUTION.attribution_text}" with a link to {canonical_url}.`,
  };
}

// Generated artifacts. `scripts/release-metadata.mjs` writes these; the release
// metadata test fails if the committed files drift from this canonical state.

export function citationCff() {
  const author = RELEASE.citation.authors[0];
  const keywords = RELEASE.citation.keywords.map((keyword) => `  - ${keyword}`).join("\n");
  return `cff-version: 1.2.0
message: "If you cite Metkagram, use this metadata and the canonical project URL."
title: "${RELEASE.citation.title}"
type: ${RELEASE.citation.type}
authors:
  - family-names: "${author.familyNames}"
    given-names: "${author.givenNames}"
version: "${getProductVersion()}"
date-released: "${RELEASE.citation.dateReleased}"
url: "${RELEASE.citation.url}"
repository-code: "${RELEASE.citation.repositoryCode}"
keywords:
${keywords}
`;
}

export function rightsJson() {
  return {
    schemaVersion: 1,
    project: RELEASE.project,
    effectiveDate: RELEASE.rights.effectiveDate,
    status: RELEASE.rights.status,
    defaultRights: RELEASE.rights.defaultRights,
    rightsNotice: RELEASE.rights.rightsNotice,
    humanReadableTerms: RELEASE.rights.humanReadableTerms,
    permissionsWithoutSeparateLicense: {
      hostedWebsiteEndUserAccess: true,
      linking: true,
      citation: true,
      limitedQuotationWherePermittedByLaw: true,
      bulkCopy: false,
      redistribution: false,
      derivedDatasetDistribution: false,
      commercialIntegration: false,
      modelTrainingOnSubstantialMaterial: false,
      modelFineTuningOnSubstantialMaterial: false,
      productionRetrievalCorpus: false,
    },
    licensingAvailable: {
      academicResearch: true,
      supervisedStudentResearch: true,
      institutionalEvaluation: true,
      teaching: true,
      dataApi: true,
      commercial: true,
      jointResearch: true,
      productIntegration: true,
    },
    researchPolicy: "https://github.com/metkagram/metkagram.github.io/blob/main/docs/RESEARCH_USE.md",
    contact: ATTRIBUTION.contact_url,
    attribution: ATTRIBUTION.attribution_text,
    historicalLicense: RELEASE.rights.historicalLicense,
    exceptions: "Nothing in this file limits rights or exceptions granted independently by applicable law or the limited platform rights required by GitHub's Terms of Service.",
  };
}
