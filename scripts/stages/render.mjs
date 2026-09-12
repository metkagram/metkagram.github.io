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
// - spoken-practice-handoff follows reasoning-packs so its bounded Pattern/Choice/Route
//   projections resolve already validated canonical objects and can publish direct read-only lookups;
// - reviewed-discovery follows Routes and the handoff API so Practice can lead with
//   explicit A/B readiness while preserving the complete canonical reference catalogue;
// - lens-knowledge-bridge writes pattern-relations.json read by cross-language-transfer;
// - learning-telemetry decorates lens/clinic/packs/transfer/exports pages and must
//   follow their renderers;
// - ai-adoption creates the build-with-metkagram pages; agent-integration-cookbook
//   then validates exact current API objects and adds provider-neutral integration
//   examples before publication-readiness and benchmark-publication extend the pages;
// - cross-language-transfer + teacher-tutor-exports feed multilingual-domain-model;
// - canonical-frame-variants resolves explicit Frame families over the published
//   multilingual model and must run after multilingual-domain-model;
// - pattern-indexability consumes the completed Frame-family layer and the derive-stage
//   quality audit, then removes noindex Pattern routes from sitemap/SEO inventory;
// - study-set-authority consumes finalized indexability plus the reviewed relation
//   graph and upgrades only the bounded canonical set cohort without creating URLs;
// - shareable-pattern-cards consumes the finalized indexability decision plus reviewed
//   annotation data and creates only noindex derivative distribution surfaces;
// - method-guides renders canonical bilingual editorial pages and extends the existing
//   Method overview before broad SEO normalization discovers the new indexable routes;
// - seo-graph-normalize remains the final broad SEO graph pass so it cannot re-add
//   noindex routes;
// - search-release-root then replaces the former noindex client-redirect root with
//   the canonical hostname identity/language gateway and ensures the root is in the sitemap;
// - internal-discovery-distribution derives continuation only from the completed
//   rendered canonical learning graph and extends the existing share bar with Save/Cite;
// - humanize-study-set-labels runs after content-producing Practice passes so internal
//   set/group IDs remain machine-readable but are never exposed as user-facing labels;
// - consent analytics decorates the completed normal HTML surface;
// - ARWP publication runs after every normal HTML-producing pass so agent discovery sees
//   the exact canonical site surface;
// - 404 generation runs last, after all global HTML mutators, because the error page is
//   deliberately a noindex recovery surface without canonical/og:url/JSON-LD identity.
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
  "scripts/spoken-practice-handoff.mjs",
  "scripts/reviewed-discovery.mjs",
  "scripts/lens-knowledge-bridge.mjs",
  "scripts/teacher-tutor-exports.mjs",
  "scripts/cross-language-transfer.mjs",
  "scripts/learning-telemetry.mjs",
  "scripts/russian-transfer-guide.mjs",
  "scripts/terminology-language-foundation.mjs",
  "scripts/practice-seo.mjs",
  "scripts/search-demand-seo.mjs",
  "scripts/ai-adoption.mjs",
  "scripts/agent-integration-cookbook.mjs",
  "scripts/publication-readiness.mjs",
  "scripts/benchmark-publication.mjs",
  "scripts/multilingual-domain-model.mjs",
  "scripts/canonical-frame-variants.mjs",
  "scripts/pattern-indexability.mjs",
  "scripts/study-set-authority.mjs",
  "scripts/shareable-pattern-cards.mjs",
  "scripts/method-guides.mjs",
  "scripts/seo-graph-normalize.mjs",
  "scripts/search-release-root.mjs",
  "scripts/apply-internal-discovery-distribution.mjs",
  "scripts/humanize-study-set-labels.mjs",
  "scripts/apply-consent-analytics.mjs",
  "scripts/apply-arwp.mjs",
  "scripts/generate-404.mjs",
];

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  runStage("render", RENDER_STEPS);
}
