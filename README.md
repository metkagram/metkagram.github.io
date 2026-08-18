# Metkagram

Metkagram is a research-oriented NLP and language-learning project built around a simple idea:

> **see the structure → reuse the frame → understand the move → choose → transfer**

The project connects visual sentence annotation with a large learner-facing library of reusable English and German patterns. It does not try to compete with large language models at general writing. Its job is to make useful language structure visible, reusable and comparable.

Production: https://metkagram.github.io

Canonical project documents:

- [Product direction](docs/PRODUCT_DIRECTION.md)
- [Terminology](docs/TERMINOLOGY.md)
- [Language architecture](docs/LANGUAGE_ARCHITECTURE.md)
- [Architecture](ARCHITECTURE.md)

## Metkagram vocabulary

The core domain chain is:

**Mark → Frame → Move → Contrast → Choice → Route → Bridge**

- **Mark** — a visual cue placed inside a real sentence.
- **Frame** — a reusable structure in one language.
- **Move** — the communicative or reasoning job behind the Frame.
- **Contrast** — a reviewed difference between nearby Frames.
- **Choice** — choose between nearby Frames before feedback.
- **Route** — an ordered learning sequence.
- **Bridge** — a reviewed cross-language relation between Frames.

`Pattern` remains the familiar learner-facing umbrella term and the compatibility term used by existing stable IDs, URLs and datasets.

Learner-facing surfaces use one naming family: **Pattern Practice, Pattern Lens, Pattern Atlas, Pattern Map, Pattern Contrasts, Pattern Choice, Pattern Routes and Pattern Bridge**.

Legacy technical names may remain in filenames and URLs while compatibility requires them. Stable identifiers are intentionally not mass-renamed for cosmetic consistency.

## Current product surfaces

### Pattern Practice

The public curriculum contains 1,000+ reusable B2–C1 English/German patterns organised through named study sets and learning paths. Existing pattern records preserve stable IDs, formulas, examples, Russian translations, variations and quality metadata.

A smaller reasoning-enabled subset adds reviewed Moves and relation metadata. It complements the full curriculum rather than replacing it.

### Pattern Lens

`/en/lens/` and `/ru/lens/` are the text-to-pattern entry points. Lens looks for high-confidence reusable structures in a sentence or short paragraph and abstains when the available rules do not support a reliable match.

### Pattern Atlas

`/en/patterns/` and `/ru/patterns/` organise existing patterns around real learner jobs such as hedging, disagreement, argumentation, professional communication, advanced questions and German word order.

### Pattern Map

The build derives reviewed relationships over the reasoning-enabled subset. The underlying data may remain graph-shaped, but the learner-facing surface is called Pattern Map: the important question is why two patterns are connected, not whether the visitor has recently completed a graph-theory course.

### Pattern Contrasts and Pattern Choice

Reviewed Contrasts explain actionable differences between nearby patterns. Pattern Choice turns those distinctions into short retrieval tasks: choose first, then reveal bounded feedback.

Existing `/clinic/` compatibility routes and technical dataset IDs remain valid during the naming migration.

### Pattern Routes

Pattern Routes compose canonical objects into short ordered learning sequences without duplicating formulas or explanations into another source of truth.

### Pattern Bridge

Pattern Bridge supports reviewed cross-language retrieval. A Bridge is not a learner translation: translation explains an example in a support language, while a Bridge records how the same or a related communicative Move is naturally realised in another learning language.

## Multilingual architecture

Metkagram treats language as independent capabilities rather than one setting:

1. **interface locale** — navigation and product explanations;
2. **learning language** — language whose Frames are studied;
3. **translation locale** — support language used for learner translations;
4. **annotation capability** — whether reviewed Metkagram Marks exist for that language.

Current public state:

- interface: English (`en`), Russian (`ru`);
- learning: English (`en`), German (`de`);
- canonical learner translations: Russian (`ru`);
- annotation: English (`en`), German (`de`).

The capability registry lives in `src/language-registry.mjs`. The build publishes `/data/languages.json` and `/data/terminology.json` plus localized glossary pages at `/en/glossary/` and `/ru/glossary/`.

This structure allows new languages to arrive incrementally. A future language can support Frames and translations before it has its own annotation profile or fully localized interface.

## Research programme

Metkagram separates product claims from research hypotheses. Current research covers visual cue utility, structural noticing, retrieval-first practice, cross-language retrieval and annotation agreement. Research protocols must distinguish evidence about general learning mechanisms from evidence about Metkagram itself.

AI is treated as a tutor/interface around canonical learning objects, not as the source of truth for the curriculum.

## Public repository boundary

This repository is the public product and publication layer, not the entire research workspace.

The public release intentionally contains the learner-facing curriculum, selected annotation material, reviewed reasoning relations, public evaluation fixtures, static APIs, research documentation and website code.

The private research core may retain the full annotated corpus, model-preparation exports, annotation engine and spaCy pipeline, linguistic heuristics, generation prompts/intermediate assets, participant data and unpublished research work.

Public visibility does not remove the current licensing and attribution terms. See [LICENSE](LICENSE), [LICENSING.md](LICENSING.md) and [docs/PUBLICATION_BOUNDARY.md](docs/PUBLICATION_BOUNDARY.md).

## Product sequence

**Pattern Practice → Pattern Lens + Pattern Atlas → Pattern Map → Pattern Contrasts → Pattern Choice → Pattern Routes → Pattern Bridge → active practice → research/evaluation → agent and teacher integrations → additional languages**

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

`npm run verify` builds the static site, validates the public curriculum, generates discovery/research/practice outputs, publishes the terminology and language capability layer, runs regression tests and checks internal links.

## Research and licensing

Metkagram is source-available, not open source or open data by default. Reading, linking and citation are welcome. Substantial reuse, derived corpora, model training, redistribution and commercial integration require scoped permission unless applicable law independently permits the use.

Research collaborations, teacher/education pilots, institutional evaluation, data/API licensing and commercial proposals are described in [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md).

## History note

Earlier repository revisions were public and, before 17 August 2026, were offered under CC BY-NC 4.0. Current source-available terms do not revoke grants already received for earlier copies. The public/private boundary governs current releases; it is not a claim that historical Git objects never existed.
