// Stage 5 — render. Produces the static site in dist/ from validated canonical
// data. The base renderer runs first; feature renderers then add their pages
// and cross-links in a fixed, dependency-annotated order.
//
// Semantic product state (rights, language capabilities, release identity,
// citations, domain relations) is already resolved before this stage via
// src/release.mjs and the validate stage. After this stage completes, only
// read-only audits run (stage 6).
//
// Ordering constraints verified during the #70 build audit:
// - connectivity injects data-connectivity containers that intent-discovery requires;
// - intent-discovery creates the intents pages that reasoning-evaluation and
//   public-learning extend;
// - reasoning-evaluation publishes the benchmark JSON that benchmark-publication reads;
// - pattern-lens creates lens pages + teaching-manifest; lens-catalogue then replaces
//   the starter/remote catalogue with the bounded job-balanced selection before the
//   lens evaluations, active-practice and lens-knowledge-bridge consume those pages;
// - discovery-growth creates the Pattern Atlas pages that practice-intent-growth
//   regenerates with extension topics and contrast-library links from;
// - contrast-library → contrast-growth → pattern-choice-clinic → reasoning-packs
//   → teacher-tutor-exports build on each other's pages and datasets;
// - lens-knowledge-bridge writes pattern-relations.json read by cross-language-transfer;
// - learning-telemetry decorates lens/clinic/packs/transfer/exports pages and must
//   follow their renderers;
// - ai-adoption creates the build-with-metkagram pages that publication-readiness
//   and benchmark-publication extend;
// - cross-language-transfer + teacher-tutor-exports feed multilingual-domain-model;
// - canonical-frame-variants resolves explicit Frame families over the published
//   multilingual model and must run after multilingual-domain-model;
// - pattern-indexability consumes the completed Frame-family layer and the derive-stage
//   quality audit, then removes noindex Pattern routes from sitemap/SEO inventory;
// - seo-graph-normalize is the render finalize pass and must stay last so it cannot
//   re-add noindex routes;
// - consent analytics decorates the completed HTML surface;
// - ARWP publication runs after every HTML-producing pass so audit sees the exact
//   machine discovery surface that will be deployed.
import path from "node:path";
import { runStage } from "./run.mjs";

export const RENDER_STEPS = [
  "scripts/build.mjs",
  "scripts/connectivity.mjs",
  "scripts/intent-discovery.mjs",
  "scripts/reasoning-evaluation.mjs",
  "scripts/public-learning.mjs",
  "scripts/research-pilot-h1.mjs",
  "scripts/enhance-licensing-pages.mjs",
  "scripts/enhance-research.mjs",
  "scripts/annotation-research.mjs",
  "scripts/pattern-lens.mjs",
  "scripts/lens-catalogue.mjs",
  "scripts/pattern-lens-evaluation.mjs",
  "scripts/pattern-lens-hard-evaluation.mjs",
  "scripts/finalize-product-direction.mjs",
  "scripts/active-practice.mjs",
  "scripts/discovery-growth.mjs",
  "scripts/practice-intent-growth.mjs",
  "scripts/search-discovery.mjs",
  "scripts/contrast-library.mjs",
  "scripts/contrast-growth.mjs",
  "scripts/pattern-choice-clinic.mjs",
  "scripts/reasoning-packs.mjs",
  "scripts/lens-knowledge-bridge.mjs",
  "scripts/teacher-tutor-exports.mjs",
  "scripts/cross-language-transfer.mjs",
  "scripts/learning-telemetry.mjs",
  "scripts/russian-transfer-guide.mjs",
  "scripts/terminology-language-foundation.mjs",
  "scripts/practice-seo.mjs",
  "scripts/search-demand-seo.mjs",
  "scripts/ai-adoption.mjs",
  "scripts/publication-readiness.mjs",
  "scripts/benchmark-publication.mjs",
  "scripts/multilingual-domain-model.mjs",
  "scripts/canonical-frame-variants.mjs",
  "scripts/pattern-indexability.mjs",
  "scripts/seo-graph-normalize.mjs",
  "scripts/apply-consent-analytics.mjs",
  "scripts/apply-arwp.mjs",
];

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runStage("render", RENDER_STEPS);
}
