# Metkagram

Metkagram is a research-oriented NLP and language-learning project built around a simple loop: make functional structure visible inside a real sentence, then reuse that structure as a pattern.

Production: https://metkagram.github.io

## Public repository boundary

This repository is the **public publication layer**, not the canonical research workspace.

The public release deliberately contains enough material to inspect, cite and evaluate the method without publishing the complete research corpus or generation pipeline:

- 72 selected annotated documents, 12 from each English/German collection;
- 28 curated reasoning-enabled English/German pattern frames;
- public schemas, provenance, APIs, research documentation and website code;
- the hosted learning and research interface.

The complete pattern curriculum, full annotated corpus, bulk annotation exports, annotation engine, linguistic heuristics, lexical rule tables and unpublished research assets are maintained in a private research core.

Public access does not grant permission to rebuild, mirror or redistribute the private/full system. See [LICENSE](LICENSE), [LICENSING.md](LICENSING.md) and [docs/PUBLICATION_BOUNDARY.md](docs/PUBLICATION_BOUNDARY.md).

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`.

## Validation

```bash
npm run verify
npm run test:e2e
```

`npm run verify` builds the static site, validates the deliberately public content, runs unit/integration tests and checks internal links. Publication-boundary tests fail if full/private-core paths are accidentally restored.

## Public content sources

- `data/metkagram-export/` contains the selected annotation showcase only.
- `data/reasoning-frames/` contains the curated public reasoning-frame showcase.
- `data/study-sets.json` supplies taxonomy metadata; the public build exposes only study sets used by published frames.
- `data/publication-manifest.json` records the deliberate public sample boundary.

Generated public outputs include `/data/advanced-patterns.json` and `/api/v1/*`, but these represent the **public showcase**, not the private full curriculum.

## Research and licensing

Metkagram is source-available, not open source or open data by default. Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.

Research collaborations, institutional evaluation, data/API licensing and commercial proposals are welcome through the process described in [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md).

## Important history note

Earlier repository revisions were public and, before 17 August 2026, were offered under CC BY-NC 4.0. The current publication boundary prevents future HEAD releases from continuing to expose the complete research workspace, but it does not pretend that previously published Git history never existed. History cleanup is a separate repository-maintenance operation and must not be attempted until the private snapshot has been independently verified.
