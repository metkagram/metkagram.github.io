# Mark–Frame Method content cluster

Status: canonical editorial architecture for the public method-guide cluster.

## Purpose

The method cluster makes the Metkagram Mark–Frame Method discoverable through useful explanatory content rather than keyword landing pages.

The cluster answers five classes of reader intent:

1. **Foundations** — what Marks, Frames, Moves, Contrasts and Choices are, and how the method fits together.
2. **Learning science** — how noticing/textual enhancement, formulaic language, retrieval, spacing and variation inform the design.
3. **Practice** — how to use real sentences, topic sets, B2–C1 patterns and short routines.
4. **Transfer** — how reuse, speech and cross-language Bridges work without assuming literal translation equivalence.
5. **Comparisons** — where Metkagram differs from or complements flashcards, grammar apps, isolated-word study and generative AI tutoring, plus a dedicated evidence-boundary page.

The public routes are:

- `/en/method/guides/`
- `/ru/method/guides/`
- `/{locale}/method/guides/{stable-slug}/`

There are 25 editorial concepts, fully localized into the two current interface locales (`en`, `ru`), producing 50 article pages plus two hub pages. English and Russian here are interface locales. This does not change the independent learning-language, translation-locale or annotation-capability registries.

## Editorial source of truth

Canonical content lives in:

- `data/method-guides/*.json` — localized editorial concepts;
- `data/method-guide-sources.json` — research-source registry;
- `src/method-guides.mjs` — validation contract.

Generated output is produced by `scripts/method-guides.mjs`. Do not hand-edit generated HTML or `dist/data/method-guides.json`.

## Writing contract

Every guide must:

- answer one concrete search/reader intent;
- explain the concept early rather than burying the answer under scene-setting;
- use natural semi-formal language rather than generic SEO copy;
- preserve canonical Metkagram terminology from `docs/TERMINOLOGY.md` and `docs/METHODOLOGY.md`;
- distinguish a language-specific **Frame** from a language-independent **Move**;
- treat a **Bridge** as reviewed functional correspondence, not automatic translation equivalence;
- connect to 2–5 genuinely useful neighbouring guides;
- cite at least one registered research source;
- contain enough editorial depth to stand alone instead of existing only to create another URL.

English copy targets readable B2-level prose unless the technical term itself requires greater precision. Russian copy is authored as Russian explanatory prose, not mechanically translated sentence by sentence.

## Evidence contract

The cluster must preserve the project-wide boundary:

> method description ≠ design rationale ≠ research hypothesis ≠ evidence

External studies cited in the cluster concern component mechanisms or adjacent research traditions such as formulaic language, textual enhancement, retrieval practice and spaced practice. They do **not** establish a learning outcome for the complete Metkagram Mark–Frame Method.

Public articles therefore include an explicit evidence-boundary note and a visible source block. The canonical release state currently declares no efficacy claim for the complete method.

When direct Metkagram studies become available, add them as identifiable sources and update only the claims directly supported by those results. Do not silently promote mechanism-level evidence into product-level efficacy language.

## Search and discovery contract

The cluster is intended to be discoverable through problem and concept queries, not only searches for the Metkagram name. Topics therefore include terms people actually use around the problem, such as:

- sentence frames;
- language patterns;
- formulaic language;
- visual grammar cues;
- retrieval practice;
- spaced practice;
- learning from real sentences;
- B2–C1 English patterns;
- English patterns for Russian speakers;
- German sentence patterns;
- flashcards vs patterns;
- grammar rules vs sentence frames;
- AI language tutors and curated language data.

`/en/method/` and `/ru/method/` link into the cluster. Each hub links every localized article, and article-level related links create lateral paths between concepts. `seo-graph-normalize.mjs` adds the completed indexable pages to the sitemap after rendering and normalizes social/structured metadata.

The generator also emits `dist/data/method-guides.json`, exposing stable IDs, categories, routes, related objects and research-source metadata to agents and other machine clients.

## Quality gates

`src/method-guides.mjs` validates before rendering:

- exact concept count;
- stable unique IDs and slugs;
- five supported categories;
- both interface localizations;
- title/description bounds;
- minimum editorial depth;
- non-empty structured sections and takeaways;
- valid research-source references;
- valid related-guide graph.

`tests/method-guides.test.mjs` additionally checks the generated cluster:

- 25 concepts / 50 localized articles;
- five guides per category;
- research provenance;
- hub-to-article discovery;
- canonical and alternate-language links;
- explicit evidence boundary on every article;
- Method-page entry points;
- machine-readable catalogue parity.

Project-wide efficacy-claim, link and SEO graph audits remain in force.

## Adding or revising a guide

1. Decide whether the change serves an existing intent or a genuinely new one. Do not create a near-duplicate page just to gain another keyword URL.
2. Research the terminology used by the intended reader and record suitable sources.
3. Add or update the canonical JSON. Keep the same stable ID and slug for normal revisions.
4. Update related-guide links so the article has a real place in the cluster.
5. If a new research source is needed, add it once to `data/method-guide-sources.json` and reference the ID.
6. Run `npm run verify` and the normal link checks before merge.
7. Inspect both locales as rendered pages; passing schema validation is not a substitute for readable prose.

If the cluster expands beyond the current 25-concept release, change `METHOD_GUIDE_COUNT` deliberately and document why the new intent deserves an independent canonical page.
