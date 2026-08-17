# Metkagram

Metkagram is a research-oriented NLP and language-learning project built around a simple loop:

> **see the structure → identify the reusable reasoning move → practise it → reuse it**

The project connects visual sentence annotation with a curated library of reusable English and German patterns. It does not try to compete with large language models at general writing. Instead, it helps a human notice which structures inside real language are worth learning and how nearby structures can express a related reasoning move.

Production: https://metkagram.github.io

The canonical product direction is documented in [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md).

## Current product direction

### Pattern Lens

`/en/lens/` and `/ru/lens/` are the main public discovery interface: paste a sentence or short paragraph and Metkagram looks for reusable structures from the published pattern collection, then highlights stable parts of likely matches.

The public Lens is deliberately conservative. It demonstrates the method without publishing the complete parser or annotation engine and should abstain when the bounded public collection does not support a reliable match. See [docs/PATTERN_LENS.md](docs/PATTERN_LENS.md).

### Pattern Library

Metkagram publishes a bounded set of curated B2–C1 learning patterns with stable IDs, examples, translations, study-set metadata, reasoning moves, provenance and canonical URLs.

Raw pattern count is not the product goal. A smaller reviewed public collection is preferred to a large synthetic catalogue. The complete curriculum remains in the private research core.

### Pattern Graph

The production build derives a bounded graph over the public reasoning patterns. It connects nearby structures using explicit public metadata such as reasoning move, study set and shared logic vocabulary.

The graph supports related-pattern navigation on pattern pages and is published at `/data/pattern-graph.json` and `/api/v1/pattern-graph.json`. See [docs/PATTERN_GRAPH.md](docs/PATTERN_GRAPH.md).

### Active practice

Each published pattern now supports a local retrieval loop. A learner writes a new English or German example before feedback, receives a conservative signal about whether the published structural frame is visible, self-rates the retrieval and schedules the same stable pattern ID for later review.

Progress is stored only in the browser under `metkagram:practice:v1`; no account or server-side learner profile is required. The Practice index shows a local due-review queue, and Pattern Lens links directly into the practice section. See [docs/PRACTICE_LOOP.md](docs/PRACTICE_LOOP.md).

The deterministic checker does not claim to grade complete grammar, naturalness or meaning. It is a retrieval aid around the canonical pattern object, not a replacement for linguistic feedback.

### AI tutors and agents

AI is treated as a tutor/interface, not as the Metkagram curriculum. Agents can use the public pattern API and Pattern Graph to choose what a learner should practise, explain a pattern in the learner's context, check an attempt and revisit the same stable learning object later.

Machine-readable guidance is published at `/api/v1/teaching-manifest.json`.

The existing `/api/v1/mcp-server.json` is a **static adapter/tool manifest**, not a hosted remote MCP transport endpoint.

## Product sequence

The current sequence is:

**Pattern Lens → Pattern Graph → active practice loop → first pilot study → agent/API integrations → teacher/research/EdTech pilots**

The first three product layers are now implemented in the public web surface. The next major milestone is a small preregistered pilot rather than another broad application layer.

New features should strengthen this loop rather than create a parallel general-purpose learning application.

## Mobile application

The earlier mobile application was an important product experiment for cards, annotation and spaced repetition, but it is no longer the active Metkagram product. The current project is web-first and research-oriented.

## Public repository boundary

This repository is the **public publication layer**, not the canonical research workspace.

The public release deliberately contains enough material to inspect, cite and evaluate the method without publishing the complete research corpus or generation pipeline:

- 72 selected annotated documents, 12 from each English/German collection;
- 30 curated reasoning-enabled English/German pattern frames across 9 reasoning moves;
- a 54-case English/Russian editorial routing benchmark for the published intent/reasoning layer;
- public sentence-to-reasoning practice links generated only from the bounded published corpus;
- a taxonomy-derived public Pattern Graph built only from published metadata;
- local-first active retrieval and review around stable public pattern IDs;
- public schemas, provenance, APIs, research documentation and website code;
- the hosted learning, Pattern Lens and research interfaces.

The routing, graph and public-learning benchmarks are internal regression and editorial-quality signals. They are not independent validation and do not establish language-learning efficacy.

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

`npm run verify` builds the static site, validates the deliberately public content, generates public-learning links, Pattern Lens and Pattern Graph outputs, wires the active-practice runtime, runs reasoning/retrieval/practice regression tests, executes unit/integration tests and checks internal links. Publication-boundary tests fail if full/private-core paths are accidentally restored.

## Public content sources

- `data/metkagram-export/` contains the selected annotation showcase only.
- `data/reasoning-frames/` contains the curated public reasoning-frame showcase.
- `data/evaluation/reasoning-intents.json` contains the bounded public routing benchmark over published reasoning frames.
- `data/study-sets.json` supplies taxonomy metadata; the public build exposes only study sets used by published frames.
- `data/publication-manifest.json` records the deliberate public sample boundary.

Generated public outputs include `/data/advanced-patterns.json`, `/data/pattern-graph.json`, `/data/reasoning-evaluation.json`, public learning connections, `/api/v1/*` and `/api/v1/teaching-manifest.json`, but these represent the **public showcase**, not the private full curriculum or private evaluation workspace.

## Research and licensing

Metkagram is source-available, not open source or open data by default. Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.

Research collaborations, teacher/education pilots, institutional evaluation, data/API licensing and commercial proposals are welcome through the process described in [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md).

## Important history note

Earlier repository revisions were public and, before 17 August 2026, were offered under CC BY-NC 4.0. The current publication boundary prevents future HEAD releases from continuing to expose the complete research workspace, but it does not pretend that previously published Git history never existed. History cleanup is a separate repository-maintenance operation and must not be attempted until the private snapshot has been independently verified.
