# Mark–Frame Method content cluster

Status: canonical editorial architecture for the public method-guide cluster.

## Purpose

The method cluster makes the Metkagram Mark–Frame Method discoverable through useful explanatory content rather than keyword landing pages.

The cluster answers six classes of reader intent:

1. **Foundations** — what Marks, Frames, Moves, Contrasts and Choices are, how Frames are extracted, what makes a pattern useful, and how the method fits together.
2. **Learning science** — how noticing/textual enhancement, formulaic language, retrieval, spacing, repetition, recognition/recall and variation inform the design.
3. **Annotated reading** — how to read with selective in-text Marks, keep meaning primary, extract a Frame, fade annotation, move toward speaking and build a personal annotated sentence set.
4. **Practice** — how to use real sentences, topic sets, B2–C1 patterns, personal work examples, contrast drills, writing Frames and short routines.
5. **Transfer** — how reuse, speech, paraphrase, register and cross-language Bridges work without assuming literal translation equivalence.
6. **Comparisons** — where Metkagram differs from or complements flashcards, grammar apps, phrasebooks, corpus tools, textbooks, isolated-word study and generative AI tutoring, plus a dedicated evidence-boundary page.

The public routes are:

- `/en/method/guides/`
- `/ru/method/guides/`
- `/{locale}/method/guides/{stable-slug}/`

There are 48 distinct editorial concepts, fully localized into the two current interface locales (`en`, `ru`), producing 96 article pages plus two hub pages. English and Russian here are interface locales. This does not change the independent learning-language, translation-locale or annotation-capability registries.

The **Annotated reading** direction is deliberately capability-aware. Its study workflow can be explained in both interface locales, but current reviewed Metkagram annotation remains an English/German learning-language capability. The French learning pilot remains Frame-only and must not be described as having reviewed Marks.

## Annotated reading direction

Annotated reading is a study mode, not a new branded domain object. It keeps the canonical Metkagram chain intact:

> real sentence → selective Mark → reusable Frame → retrieval → variation → reuse

The editorial principle is **text first, annotation second, reuse third**. The learner should first understand the sentence as language, then inspect the smallest useful cue, then move away from the cue toward a Frame and independent production.

The first release contains eight connected topics:

1. what annotated reading is and where it fits;
2. how to read an annotated sentence without losing meaning;
3. how much annotation is useful;
4. how to move from annotation to a reusable Frame;
5. when and how to fade Marks;
6. how to continue from annotated reading into speaking;
7. how B2–C1 learners can use annotation for stance, chunks and choices rather than elementary relabelling;
8. how to build a small personal annotated sentence set from real language.

This direction must not turn Metkagram into a promise that colour itself teaches language. Marks are temporary attention cues. The learner-facing text remains primary, visible annotation stays selective, and the content repeatedly moves toward retrieval, variation and production.

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
- keep annotation capability separate from interface and learning-language capability;
- connect to 2–5 genuinely useful neighbouring guides;
- cite at least one registered research source;
- contain enough editorial depth to stand alone instead of existing only to create another URL.

English copy targets readable B2-level prose unless the technical term itself requires greater precision. Russian copy is authored as Russian explanatory prose, not mechanically translated sentence by sentence.

For annotation content in particular, write from a learner task rather than from the internal annotation schema. The public page may explain Marks, spans, selective cues or fading, but it should not expose private research-core machinery or imply that every available linguistic feature belongs on screen.

## Evidence contract

The cluster must preserve the project-wide boundary:

> method description ≠ design rationale ≠ research hypothesis ≠ evidence

External studies cited in the cluster concern component mechanisms or adjacent research traditions such as formulaic language, textual enhancement, retrieval practice and spaced practice. They do **not** establish a learning outcome for the complete Metkagram Mark–Frame Method.

This is especially important for annotated reading. Research on textual or visual input enhancement gives a rationale for testing selective salience and noticing. It does not establish that adding more labels improves learning, that a visible cue should remain permanently, or that the complete Metkagram annotated-reading workflow outperforms another study method.

Public articles therefore include an explicit evidence-boundary note and a visible source block. The canonical release state currently declares no efficacy claim for the complete method.

When direct Metkagram studies become available, add them as identifiable sources and update only the claims directly supported by those results. Do not silently promote mechanism-level evidence into product-level efficacy language.

## Search and discovery contract

The cluster is intended to be discoverable through problem and concept queries, not only searches for the Metkagram name. Topics therefore include terms people actually use around the problem, such as:

- sentence frames;
- language patterns;
- formulaic language;
- visual grammar cues;
- annotated reading and annotated sentences;
- textual enhancement and input enhancement;
- learning from marked-up text;
- how much annotation to show;
- fading language-learning hints;
- moving from annotated text to speaking;
- B2–C1 annotated reading;
- personal annotated sentence sets;
- retrieval practice;
- spaced practice;
- repetition and recognition vs recall;
- learning from real sentences;
- B2–C1 English patterns;
- personal language pattern sets;
- English patterns for Russian speakers;
- German sentence patterns and English–German Bridges;
- translation vs functional paraphrase;
- language register transfer;
- flashcards vs patterns;
- phrasebooks vs reusable Frames;
- grammar rules vs sentence frames;
- corpus tools and curated language objects;
- textbooks and pattern practice;
- AI language tutors and curated language data.

`/en/method/` and `/ru/method/` link into the cluster. Each hub links every localized article, and article-level related links create lateral paths between concepts. The annotated-reading overview is also featured from the method preview so the direction is not buried inside the hub. `seo-graph-normalize.mjs` adds the completed indexable pages to the sitemap after rendering and normalizes social/structured metadata.

The generator also emits `dist/data/method-guides.json`, exposing stable IDs, categories, routes, related objects and research-source metadata to agents and other machine clients.

## Quality gates

`src/method-guides.mjs` validates before rendering:

- exact concept count;
- stable unique IDs and slugs;
- six supported categories;
- both interface localizations;
- title/description bounds;
- minimum editorial depth;
- non-empty structured sections and takeaways;
- valid research-source references;
- valid related-guide graph.

`tests/method-guides.test.mjs` additionally checks the generated cluster:

- 48 concepts / 96 localized articles;
- eight guides per category;
- eight-guide bilingual annotated-reading direction;
- research provenance;
- hub-to-article discovery;
- canonical and alternate-language links;
- explicit evidence boundary on every article;
- Method-page entry points including annotated reading;
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

If the cluster expands beyond the current 48-concept release, change `METHOD_GUIDE_COUNT` deliberately and document why the new intent deserves an independent canonical page.
