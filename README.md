# Metkagram

Metkagram is a research-oriented NLP and language-learning project built around a simple loop:

> **see the structure → learn the pattern → reuse it**

The project connects visual sentence annotation with a curated library of reusable English and German patterns. It does not try to compete with large language models at general writing. Instead, it helps a human notice which structures inside real language are worth learning.

Production: https://metkagram.github.io

## Current product direction

### Pattern Library

Metkagram publishes a bounded set of curated B2–C1 learning patterns with stable IDs, examples, translations, study-set metadata, reasoning moves, provenance and canonical URLs.

### Pattern Lens

`/en/lens/` and `/ru/lens/` provide a public interactive preview: paste a sentence or short paragraph and Metkagram looks for reusable structures from the published pattern collection, then highlights stable parts of likely matches.

The public Lens is deliberately conservative. It demonstrates the method without publishing the complete parser or annotation engine. See [docs/PATTERN_LENS.md](docs/PATTERN_LENS.md).

### AI tutors and agents

AI is treated as a tutor/interface, not as the Metkagram curriculum. Agents can use the public pattern API to choose what a learner should practise, explain a pattern in the learner's context, check an attempt and revisit the same learning object later.

Machine-readable guidance is published at `/api/v1/teaching-manifest.json`.

The existing `/api/v1/mcp-server.json` is a **static adapter/tool manifest**, not a hosted remote MCP transport endpoint.

## Mobile application

The earlier mobile application was an important product experiment for cards, annotation and spaced repetition, but it is no longer the active Metkagram product. The current project is web-first and research-oriented.

## Public repository boundary

This repository is the **public publication layer**, not the canonical research workspace.

The public release deliberately contains enough material to inspect, cite and evaluate the method without publishing the complete research corpus or generation pipeline:

- 72 selected annotated documents, 12 from each English/German collection;
- 30 curated reasoning-enabled English/German pattern frames across 9 reasoning moves;
- a 54-case English/Russian editorial routing benchmark for the published intent/reasoning layer;
- public sentence-to-reasoning practice links generated only from the bounded published corpus;
- public schemas, provenance, APIs, research documentation and website code;
- the hosted learning, Pattern Lens and research interfaces.

The routing and public-learning benchmarks are internal regression and editorial-quality signals. They are not independent validation and do not establish language-learning efficacy.

The complete pattern curriculum, full annotated corpus, bulk annotation exports, annotation engine, spaCy pipeline, linguistic heuristics, lexical rule tables and unpublished research assets are maintained in a private research core.

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

`npm run verify` builds the static site, validates the deliberately public content, generates public-learning links and Pattern Lens, runs the reasoning-routing regression benchmark, executes unit/integration tests and checks internal links. Publication-boundary tests fail if full/private-core paths are accidentally restored.

## Public content sources

- `data/metkagram-export/` contains the selected annotation showcase only.
- `data/reasoning-frames/` contains the curated public reasoning-frame showcase.
- `data/evaluation/reasoning-intents.json` contains the bounded public routing benchmark over published reasoning frames.
- `data/study-sets.json` supplies taxonomy metadata; the public build exposes only study sets used by published frames.
- `data/publication-manifest.json` records the deliberate public sample boundary.

Generated public outputs include `/data/advanced-patterns.json`, `/data/reasoning-evaluation.json`, public learning connections, `/api/v1/*` and `/api/v1/teaching-manifest.json`, but these represent the **public showcase**, not the private full curriculum or private evaluation workspace.

## Research and licensing

Metkagram is source-available, not open source or open data by default. Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.

Research collaborations, teacher/education pilots, institutional evaluation, data/API licensing and commercial proposals are welcome through the process described in [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md).

## Important history note

Earlier repository revisions were public and, before 17 August 2026, were offered under CC BY-NC 4.0. The current publication boundary prevents future HEAD releases from continuing to expose the complete research workspace, but it does not pretend that previously published Git history never existed. History cleanup is a separate repository-maintenance operation and must not be attempted until the private snapshot has been independently verified.
