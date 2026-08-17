# Metkagram publication boundary

Effective: 17 August 2026

Metkagram uses a **private research core → deliberate public product/release** model. The boundary protects the expensive reconstruction machinery and unpublished research without hollowing out the learner-facing product.

## Public by deliberate product decision

The following are part of the public Metkagram product:

- the established **1,000+ reusable B2–C1 English/German Practice curriculum** in `data/advanced-patterns.json`;
- study-set and learning-path taxonomy in `data/study-sets.json`;
- curated reasoning-enabled frames and their public examples;
- selected examples that explain the visual annotation method;
- the bounded 72-document annotation showcase;
- schemas, provenance and interoperability surfaces for published material;
- bounded evaluation fixtures and reports that operate only on published material;
- Pattern Lens, Pattern Graph and browser-side active-practice code;
- website/UI code needed to publish, inspect and practise the released material.

Publishing the learner-facing pattern curriculum does **not** mean the generation or annotation system is public. Patterns are learning objects; the machinery used to create, expand, annotate and research them is a separate asset class.

## Private by default

Keep these in the private research core unless a specific release decision says otherwise:

- the full annotated document corpus beyond the selected public showcase;
- bulk annotation exports and model-preparation datasets;
- annotation-engine implementation, spaCy pipeline, linguistic heuristics and lexical rule tables;
- generation prompts, intermediate generation artifacts and unpublished candidate patterns;
- private/raw evaluation artifacts and participant research data;
- unpublished experiments and research notes;
- implementation details whose release would materially reduce the work required to reproduce the complete annotation/generation pipeline.

## Current release boundary

The GitHub Pages publication contains:

- 12 documents from each of six English/German source collections, 72 documents total;
- at least 1,000 complete learner-facing Practice patterns across the published study-set taxonomy;
- 30 curated reasoning-enabled English/German frames across 9 reasoning moves;
- a 54-case English/Russian editorial routing benchmark for the published intent/reasoning layer;
- a 28-case English/German quality fixture for public sentence → intent → recommended-frame links: 18 positive controls and 10 negative controls.

The 30 reasoning frames are a reviewed research/graph subset inside the much larger Practice library. They are not intended to cap or replace the Practice curriculum.

The routing and learning-link benchmarks are regression instruments, not independent validation and not evidence that the learning method improves outcomes. Relation strength remains categorical (`direct`, `supported`, `prompt`); no probability or statistical confidence percentage is claimed.

`/data/advanced-patterns.json`, `/api/v1/patterns.json` and related pattern routes represent the **full deliberately public Practice curriculum**. Annotation datasets and research surfaces remain bounded according to this document.

## Publication gate

Before merging a public release:

1. Run `npm run verify`.
2. Confirm `tests/publication-boundary.test.mjs` passes.
3. Confirm the full Practice curriculum remains available and validates at 1,000+ complete patterns.
4. Confirm private annotation/generation infrastructure has not reappeared.
5. Confirm licensing/provenance metadata remains attached to machine-readable exports.
6. If an evaluation artifact is public, confirm that it references only deliberately published material and states its evidence limits.
7. If public learning connections are generated, confirm every linked frame and intent is public and positive/negative controls pass.
8. Prefer removing ambiguous generated links over inflating coverage statistics.

## Paths that must remain private

The following source paths are intentionally absent from the current public HEAD:

- `data/pattern-annotations.json.gz`
- `data/source-tag-rules.ts`
- `annotation_service/`

`data/advanced-patterns.json` is intentionally **not** on this list. It is the public learner-facing Practice corpus and must not be removed merely to enforce the research boundary.

## Git history

Removing material from a current branch does not erase prior public Git history or copies already obtained by third parties. Any history rewrite is a separate repository-maintenance operation and should never be confused with defining the product/research publication boundary.
