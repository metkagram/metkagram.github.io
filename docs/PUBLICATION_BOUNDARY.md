# Metkagram publication boundary

Effective: 17 August 2026

Metkagram uses a **private core → deliberate public release** model.

## Private by default

Keep these in the private research core unless a specific release decision says otherwise:

- complete pattern curricula and bulk corpus exports;
- full annotated document collections;
- model-preparation and generated annotation datasets;
- annotation-engine implementation, heuristics and lexical rule tables;
- generation prompts, intermediate data and private/raw evaluation artifacts;
- unpublished experiments and research notes;
- implementation details whose release would materially reduce the work required to reproduce the complete system.

## Suitable for the public publication layer

- selected examples that explain the method;
- a deliberately bounded annotation sample;
- curated reasoning frames and reusable language examples;
- schemas, provenance and interoperability examples for the public sample;
- research hypotheses, methodology and aggregate results approved for release;
- bounded evaluation benchmarks and reports when they operate only on published material and do not expose the private generation pipeline;
- cue-based pedagogical links between already published sentences, intents and frames when relation strength, evidence type and limits are explicit;
- website/UI code needed to publish and inspect the released material.

## Current release boundary

The GitHub Pages publication contains:

- 12 documents from each of six English/German source collections, 72 documents total;
- 30 curated reasoning-enabled English/German frames across 9 reasoning moves;
- only the study-set metadata required by those published frames;
- a 54-case English/Russian editorial routing benchmark for the published intent/reasoning layer, plus its generated evaluation report;
- a 28-case English/German quality fixture for public sentence → intent → recommended-frame links: 18 positive controls and 10 negative controls, all derived from sentences already present in the 72-document release.

The routing benchmark is published deliberately for transparency and regression testing. It measures deterministic intent → reasoning move → public frame routing against curated expectations. It is **not** independent validation and **not** evidence that the learning method improves outcomes.

The public learning-link layer is also deliberately bounded. A connection means that a visible cue in a published sentence supports the same reasoning move or communicative intent as a recommended public frame. It is a pedagogical bridge, **not** a claim that the source sentence and frame are semantically or syntactically equivalent. Relation strength is categorical (`direct`, `supported`, `prompt`); no probability or statistical confidence percentage is claimed. The layer must not import the private full curriculum, private annotation engine or unpublished corpus to improve coverage.

The positive and negative learning-link controls are editorial regression cases, not a statistically sampled precision/recall study. Negative controls exist specifically to prevent broad mappings such as ordinary `if/wenn` → `only if`, generic `wenn ... würde` → hypothesis test, preference → decision, or merely mentioning an assumption → challenging it.

`/data/advanced-patterns.json`, `/api/v1/patterns.json` and similar generated routes are full representations of the **public release only**. They are not exports of the private full corpus. `/data/learning-connections.json` and `/data/learning-connections-quality.json` are likewise generated only from the bounded public corpus and public reasoning frames.

## Publication gate

Before merging a public release:

1. Run `npm run verify`.
2. Confirm `tests/publication-boundary.test.mjs` passes.
3. Confirm no private-core path has reappeared.
4. Confirm every public dataset is intentionally bounded and documented.
5. Check licensing/provenance metadata remains attached to machine-readable exports.
6. Review whether a new file makes reconstruction of the private pipeline materially easier.
7. If an evaluation artifact is public, confirm that it references only deliberately published material and states its evidence limits.
8. If public learning connections are generated, confirm every linked frame and intent is public, all relation strengths are from the reviewed categorical set, and both positive and negative quality controls pass.
9. Prefer removing ambiguous links over preserving coverage statistics.

## Forbidden public paths

The following source paths are intentionally absent from the current public HEAD:

- `data/advanced-patterns.json` (private full source; a bounded public file is generated at build time)
- `data/pattern-annotations.json.gz`
- `data/source-tag-rules.ts`
- `annotation_service/`

Do not restore them merely to make local development more convenient. Change the public build contract instead.

## Git history

Removing material from the current branch does not erase prior public Git history or copies already obtained by third parties. Any history rewrite must be treated as a separate security/repository-maintenance operation and only performed after the private snapshot is verified and backed up.
