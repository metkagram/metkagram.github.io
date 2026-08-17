# Metkagram publication boundary

Effective: 17 August 2026

Metkagram uses a **private core → deliberate public release** model.

## Private by default

Keep these in the private research core unless a specific release decision says otherwise:

- complete pattern curricula and bulk corpus exports;
- full annotated document collections;
- model-preparation and generated annotation datasets;
- annotation-engine implementation, heuristics and lexical rule tables;
- generation prompts, intermediate data and evaluation artifacts;
- unpublished experiments and research notes;
- implementation details whose release would materially reduce the work required to reproduce the complete system.

## Suitable for the public publication layer

- selected examples that explain the method;
- a deliberately bounded annotation sample;
- curated reasoning frames and reusable language examples;
- schemas, provenance and interoperability examples for the public sample;
- research hypotheses, methodology and aggregate results approved for release;
- website/UI code needed to publish and inspect the released material.

## Current release boundary

The GitHub Pages publication contains:

- 12 documents from each of six English/German source collections, 72 documents total;
- 28 curated reasoning-enabled English/German frames across 9 reasoning moves;
- only the study-set metadata required by those published frames.

`/data/advanced-patterns.json`, `/api/v1/patterns.json` and similar generated routes are full representations of the **public release only**. They are not exports of the private full corpus.

## Publication gate

Before merging a public release:

1. Run `npm run verify`.
2. Confirm `tests/publication-boundary.test.mjs` passes.
3. Confirm no private-core path has reappeared.
4. Confirm every public dataset is intentionally bounded and documented.
5. Check licensing/provenance metadata remains attached to machine-readable exports.
6. Review whether a new file makes reconstruction of the private pipeline materially easier.

## Forbidden public paths

The following source paths are intentionally absent from the current public HEAD:

- `data/advanced-patterns.json` (private full source; a bounded public file is generated at build time)
- `data/pattern-annotations.json.gz`
- `data/source-tag-rules.ts`
- `annotation_service/`

Do not restore them merely to make local development more convenient. Change the public build contract instead.

## Git history

Removing material from the current branch does not erase prior public Git history or copies already obtained by third parties. Any history rewrite must be treated as a separate security/repository-maintenance operation and only performed after the private snapshot is verified and backed up.
