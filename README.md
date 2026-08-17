# Metkagram

Metkagram is a research-oriented NLP and language-learning project built around a simple loop:

> **see the structure → identify the reusable move → practise it → reuse it**

The project connects visual sentence annotation with a large learner-facing library of reusable English and German patterns. It does not try to compete with large language models at general writing. Instead, it helps a human notice which structures inside real language are worth learning and how nearby structures can express a related communicative or reasoning move.

Production: https://metkagram.github.io

The canonical product direction is documented in [docs/PRODUCT_DIRECTION.md](docs/PRODUCT_DIRECTION.md).

## Current product direction

### Pattern Lens

`/en/lens/` and `/ru/lens/` are the main discovery interface: paste a sentence or short paragraph and Metkagram looks for reusable structures from the published collection, then highlights stable parts of likely matches.

The Lens remains precision-first. It should abstain when the available rules do not support a reliable match rather than manufacture a plausible-looking answer. See [docs/PATTERN_LENS.md](docs/PATTERN_LENS.md).

### Pattern Library and Practice

Practice is a substantial public product surface, not a tiny showcase. The repository publishes the established **1,000+ reusable B2–C1 English/German patterns** in `data/advanced-patterns.json`, organised through named study sets and learning paths. Each pattern keeps a stable ID, formulas, examples, Russian translations and quality metadata.

A smaller reasoning-enabled subset currently adds explicit reasoning moves, logic metadata, evaluation fixtures and Pattern Graph relations. That curated subset complements the full Practice curriculum; it does not replace it.

Pattern quantity alone is not evidence of learning quality. The existing curriculum is public because it is the learner-facing product, while generation machinery, private research assets and the full annotation pipeline remain outside the public release boundary.

### Pattern Graph

The production build derives a bounded graph over the reasoning-enabled public patterns. It connects nearby structures using explicit metadata such as reasoning move, study set and shared logic vocabulary.

The graph supports related-pattern navigation and is published at `/data/pattern-graph.json` and `/api/v1/pattern-graph.json`. See [docs/PATTERN_GRAPH.md](docs/PATTERN_GRAPH.md).

### Active practice

Each published pattern supports a local retrieval loop. A learner writes a new English or German example before feedback, receives a conservative signal about whether the structural frame is visible, self-rates the retrieval and schedules the same stable pattern ID for later review.

Progress is stored only in the browser under `metkagram:practice:v1`; no account or server-side learner profile is required. See [docs/PRACTICE_LOOP.md](docs/PRACTICE_LOOP.md).

The deterministic checker does not claim to grade complete grammar, naturalness or meaning. It is a retrieval aid around the canonical pattern object.

### Research programme

Metkagram separates product claims from research hypotheses. The current H1 browser pilot measures cue utility around the visual notation; it does not claim language-learning efficacy. Research protocols and evidence limits are documented under `docs/RESEARCH_*`.

### AI tutors and agents

AI is treated as a tutor/interface, not as the canonical curriculum. Agents can use stable public pattern IDs and APIs to choose what a learner should practise, explain a pattern in context, check an attempt and revisit the same learning object later.

Machine-readable guidance is published at `/api/v1/teaching-manifest.json`. The existing `/api/v1/mcp-server.json` is a static adapter/tool manifest, not a hosted remote MCP transport endpoint.

## Product sequence

The working sequence is:

**Pattern Lens → Pattern Graph → active practice loop → H1 pilot → H1 report → agent/API integrations → teacher/research/EdTech pilots**

The learner-facing Practice library remains a core content layer underneath that sequence.

## Public repository boundary

This repository is the public publication and product layer, not the entire research workspace.

The public release intentionally contains:

- 72 selected annotated documents, 12 from each English/German collection;
- the established 1,000+ reusable B2–C1 Practice curriculum with study sets and learning paths;
- 30 curated reasoning-enabled English/German frames across 9 reasoning moves;
- public evaluation fixtures that operate only on deliberately published material;
- Pattern Lens, Pattern Graph and local-first practice code;
- public schemas, provenance, APIs, research documentation and website code.

The private research core retains the full annotated corpus, bulk annotation/model-preparation exports, annotation engine and spaCy pipeline, linguistic heuristics and lexical rule tables, generation prompts/intermediate assets, participant data and unpublished research work.

Public visibility does not remove the current licensing and attribution terms. See [LICENSE](LICENSE), [LICENSING.md](LICENSING.md) and [docs/PUBLICATION_BOUNDARY.md](docs/PUBLICATION_BOUNDARY.md).

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

`npm run verify` validates the full public Practice curriculum, builds the static site, generates public-learning, Pattern Lens and Pattern Graph outputs, runs regression tests and checks internal links. Publication-boundary tests protect private research infrastructure without treating the public Practice corpus as private.

## Public content sources

- `data/advanced-patterns.json` contains the full learner-facing Practice curriculum.
- `data/study-sets.json` contains study sets and learning paths.
- `data/reasoning-frames/` contains the curated reasoning-enabled extension.
- `data/metkagram-export/` contains the selected annotation showcase only.
- `data/evaluation/` contains bounded public regression fixtures over published material.
- `data/publication-manifest.json` records the deliberate release boundary.

Generated outputs include `/data/advanced-patterns.json`, `/data/pattern-graph.json`, `/data/reasoning-evaluation.json`, `/api/v1/*` and `/api/v1/teaching-manifest.json`.

## Research and licensing

Metkagram is source-available, not open source or open data by default. Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.

Research collaborations, teacher/education pilots, institutional evaluation, data/API licensing and commercial proposals are welcome through [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md).

## History note

Earlier repository revisions were public and, before 17 August 2026, were offered under CC BY-NC 4.0. Current source-available terms do not revoke grants already received for earlier copies. The public/private boundary governs current releases; it is not a claim that historical Git objects never existed.
