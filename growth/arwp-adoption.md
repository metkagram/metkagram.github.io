# Metkagram — ARWP Growth adoption record

Baseline: 2026-09-06  
Site identity: https://metkagram.github.io/  
Primary indexable landing: https://metkagram.github.io/en/  
Repository: `metkagram/metkagram.github.io`  
Verticals: educational knowledge base / documentation / research dataset  
Goals: Search / generative Search / Discover-ready presentation / AI citation / agent retrieval

This record documents an ARWP Growth implementation. It is implementation evidence, not a ranking, recommendation, indexing or citation claim.

## Site classification

Metkagram is not a generic grammar blog. Its distinctive public object graph is:

`annotated sentence → reusable pattern → variation → communicative intent → study set → contrast / relation → provenance`

The primary growth surface is therefore reviewed language-pattern knowledge and intent discovery. Machine-readable API, MCP, `llms.txt` and ARWP metadata support retrieval and integration but do not replace ordinary Search quality.

The root `/` route is intentionally a language-selection gateway. It is `noindex,follow`, declares `/en/` as canonical and `x-default`, and routes users to English or Russian. ARWP Growth therefore evaluates `/en/`; treating the gateway itself as an indexable homepage would create a false eligibility failure and duplicate the locale landing policy.

## Publisher policy

- Public Search crawling: allowed for editorially indexable public routes; the root locale gateway and low-confidence or insufficient pattern variants can remain `noindex,follow` under explicit repository policy.
- Search/answer crawlers: preserve the repository's explicit crawler policy and audit provider-specific Search access independently from model-training permission.
- Model training: this rollout does not relax training/reuse permissions. The public rights manifest disallows model training or fine-tuning on substantial Metkagram material without a separate licence.
- Public reuse/license boundary: source-available, all-rights-reserved by default; linking, citation and limited lawful quotation are explicitly allowed. Bulk copying, redistribution and production retrieval-corpus use require separate permission/licensing.

## Selected hypotheses

| Hypothesis ID | Baseline observation | Action | Verification | Outcome signal / owner-data gate |
| --- | --- | --- | --- | --- |
| `search-foundation-first` | `/` is an intentional noindex locale gateway; `/en/` is the canonical indexable landing. Static HTML, canonicals, hreflang, sitemap/robots generation, explicit pattern indexability policy and deployment verification already exist. | Audit `/en/`, not the gateway; keep eligibility checks ahead of optional agent metadata and retain truthful noindex decisions for weak pattern variants. | `npm run verify`, deployment smoke, recurring ARWP Growth artifact targeting `/en/`. | Indexed priority routes, Search impressions; owner data only. |
| `non-commodity-evidence` | Metkagram owns a structured annotation/pattern corpus, reviewed Pattern Atlas topics, contrasts, provenance and research surfaces. | Expand reviewed evidence, contrasts and learner-intent hubs; do not manufacture keyword/query variants. | Editorial review + existing quality/SEO tests. | Non-brand impressions/clicks and use of priority learning surfaces. |
| `answer-addressability` | Long-form and learning pages use descriptive sections and many stable fragment IDs; internal graph links already connect topic → set → pattern. | Preserve stable fragments and direct answer sections when extending priority pages. | Build/link tests plus ARWP Growth audit. | Deep-link traffic and more precise citation/retrieval observations. |
| `identity-and-provenance` | Canonical `Organization` / `WebSite` entities, provenance endpoints, citation metadata and repository identity are already present. | Keep one canonical Metkagram identity; do not invent authors, credentials or dates. | Generated JSON-LD and provenance tests. | Consistent source attribution and entity interpretation. |
| `discover-visual-preview` | Pages allow `max-image-preview:large` and expose a 1200×630 social/primary image. The current default image is site-level rather than route-specific. | Keep permissive large previews; for high-value editorial/research pages prefer a real teaching/research visual when one exists instead of generating decorative images. | Meta/JSON-LD regression checks; manual visual review. | Discover/image impressions where available. |
| `chatgpt-search-access` | Agent/search discovery is explicit, while reuse rights are intentionally restrictive. | Keep Search/answer access and training policy as separate publisher decisions; never infer permission from `llms.txt` or MCP availability. | ARWP crawler audit + rights/profile consistency checks. | ChatGPT referrals/citations when observable. |
| `freshness-without-fake-recency` | Generated routes carry release-backed dates and the search workflow already treats freshness as evidence, not page churn. | Keep sitemap/page dates tied to meaningful release/content changes; use IndexNow only for changed URLs. | Build audits + IndexNow workflow tests. | Recrawl after meaningful updates; no synthetic date churn. |
| `platform-ai-measurement` | A privacy-safe page-aggregate Search measurement workflow already exists; raw query data stays private. | Use recurring ARWP audit as implementation evidence and owner-side Google/Bing/AI/referral metrics as outcome evidence. Preserve neutral/negative results. | `scripts/search-measurement.mjs` + weekly Growth artifact. | Search/generative visibility, AI citations, cited priority pages, referral traffic. |

`preferred-source-loop` is not enabled in this rollout. Metkagram is an evergreen learning/reference product rather than a recurring news publisher, so a user-facing Preferred Sources control would be premature without evidence of repeat-reader fit.

`agent-readable-routes` remains an interoperability experiment. Metkagram already exposes real read-only machine surfaces; they are retained because they are useful integrations, not because they are treated as ranking factors.

## Applied 2026-09-06 delta

1. Add a recurring ARWP Growth Profile workflow that follows current ARWP guidance but stores the exact evaluated ARWP revision with each artifact.
2. Update the static ARWP validator to the current reviewed ARWP revision.
3. Correct localized ARWP discovery so German and French agent-routing files are addressable by their own locale if/when those HTML locales are rendered, while English remains the explicit fallback.
4. Extend regression coverage so declared agent-routing languages and the renderer cannot silently diverge.
5. Align Growth audit scope with the real Search architecture: retain the root noindex locale gateway and evaluate the canonical `/en/` landing instead.
6. Keep current crawler/reuse rights unchanged; this rollout does not silently broaden training or bulk-reuse permission.

## Build / CI evidence

- Site build/test authority: `npm run verify`.
- Production authority: `.github/workflows/deploy-pages.yml` builds, tests, deploys and runs production + ARWP smoke checks.
- Static ARWP validation: `.github/workflows/arwp.yml`.
- Recurring Growth audit: `.github/workflows/arwp-growth.yml`, target `https://metkagram.github.io/en/`.
- ARWP baseline revision used for this rollout: `0d60109d0986d1f15fa30cce7bbdaec36ceb108f` (2026-09-06).
- Owner-data / longitudinal checks remain external: Search Console generative visibility, Bing AI citations, ChatGPT/referral observations and Discover/image performance where available.

## Measurement window

Before: use the latest stable owner-side period available before 2026-09-06.  
After: compare a like-for-like window only after enough impressions/citations have accumulated.  
Metrics: non-brand Search impressions/clicks/CTR by route type; generative Search visibility where available; Bing AI citations/cited pages; ChatGPT referrals/citations; Discover/image impressions for eligible priority content.

Missing metrics remain missing rather than being converted to zero or inferred from repository changes.

## Decision

`keep`

Reason: the rollout strengthens reproducibility, current recommendation coverage and locale correctness without adding speculative ranking claims, synthetic content, fake freshness or broader reuse permissions. Revisit individual hypotheses when owner-side evidence or upstream platform guidance changes.
