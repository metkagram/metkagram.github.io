# Architecture

## Decision

Metkagram uses a small Node.js static generator instead of a client-only SPA or server framework. Public learning content does not require a framework runtime. Static generation preserves crawlable HTML, deterministic GitHub Pages paths, reproducible agent-facing data and a small runtime surface.

The product model is:

> **real sentence → Mark → Frame → Move → Contrast → Choice → Route → Bridge → reuse**

`Pattern` remains the public umbrella and compatibility term used by the existing curriculum, stable IDs and URLs. The precise domain vocabulary is defined in `docs/TERMINOLOGY.md`.

## Domain objects

Metkagram separates knowledge objects from product surfaces.

Knowledge objects:

1. **Mark** — a visual cue attached to language inside a sentence.
2. **Frame** — a reusable structure in one specific learning language.
3. **Move** — the language-independent communicative or reasoning job.
4. **Contrast** — a reviewed distinction between nearby Frames.
5. **Choice** — a retrieval task built around a reviewed distinction.
6. **Route** — an ordered sequence of reviewed learning objects.
7. **Bridge** — a reviewed relation between Frames across languages.

Learner-facing discovery/practice surfaces use stable names such as Pattern Practice, Pattern Lens, Pattern Atlas and Pattern Map. Technical filenames and legacy URLs may retain earlier names while compatibility requires them.

## Language model

Language is not one global setting. Metkagram models independent capabilities:

1. **interface locale** — navigation, help and product copy;
2. **learning language** — language whose Frames/examples are studied;
3. **translation locale** — language used for learner translations/glosses;
4. **annotation capability** — whether reviewed Metkagram Marks/annotation exist for that learning language.

Current capabilities are registered in `src/language-registry.mjs` and described in `docs/LANGUAGE_ARCHITECTURE.md`.

Current public state:

- interface: `en`, `ru`;
- learning: `en`, `de`;
- translation locale in canonical pattern records: `ru`;
- annotation: `en`, `de`.

These sets are deliberately not assumed to be equal. A future learning language can have Frames and translations before it has annotation or a localized interface.

## Layers

1. **Canonical content** — source JSON in `data/` holds annotated documents, reusable patterns, study sets and reviewed relation data. UI translations remain separate from learning-language content.
2. **Language capability registry** — `src/language-registry.mjs` describes which language roles are currently supported. New architecture must derive capabilities from this registry instead of hardcoded English/German branches.
3. **Validation and quality** — `src/content.mjs` validates identifiers, language records, translations, uniqueness and editorial completeness. Existing validation remains compatibility-oriented while the multilingual schema migrates incrementally.
4. **Static rendering** — `src/render.mjs` owns the shared layout and primary page templates. Build/post-build scripts add reviewed feature surfaces while keeping GitHub Pages output static.
5. **Discovery and agent surfaces** — static API, search indexes, relation data, `/data/languages.json` and `/data/terminology.json` expose bounded machine-readable state.
6. **Progressive enhancement** — browser JavaScript adds filters, navigation and practice interactions. Canonical content remains useful without JavaScript.
7. **Optional annotation service** — `annotation_service/` is an editorial NLP tool. Production rendering remains model-independent; service output is versioned static input rather than a runtime dependency.
8. **Compatibility backend** — GitHub Pages hosts no server functions. Historical compatibility services remain separate and must not shape the new domain model.

## Multilingual data direction

The current pattern schema stores language realizations in `langs[]` and translations in fields such as `translation_ru`. This remains valid input during migration.

New translation-aware code should accept the future form:

```json
{
  "translations": {
    "ru": "..."
  }
}
```

The compatibility helper `getTranslation(record, locale)` in `src/language-registry.mjs` reads both the future map and legacy `translation_<locale>` fields.

Long-term, language-independent Moves and language-specific Frames should become explicit rather than being inferred from two entries inside one bilingual record. Cross-language equivalence then belongs in reviewed Bridge records instead of being assumed from record shape.

This matters for expansion because languages do not reliably provide one-to-one realizations of every construction.

## Data quality boundary

Metkagram does not treat record count as editorial quality.

For the existing EN/DE curriculum:

- required formulas, examples and Russian learner translations remain build-validated;
- genuine variation remains preferable to synthetic padding;
- quality metadata records duplicate and translation completeness signals;
- `quality.indexable` is an editorial/content signal, not a marketing claim.

For future languages, validation must be capability-aware. A language with `annotation: false` must not fail merely because annotated documents are absent. A language advertised as having translations must fail when its required translation fields are missing.

## Reproducibility and provenance

Every API record carries canonical source metadata and a content hash where the current pipeline provides it. Dataset versions combine package/version information with deterministic canonical-data fingerprints.

`SITE_RELEASE_DATE` represents the verified editorial release date for substantial changes. It is not generated from wall-clock build time.

## Release and rights metadata

`src/release.mjs` is the canonical release state for the project: canonical URL, release date, product/dataset versions, current rights/licensing state, citation metadata, language capabilities and the public evidence boundary. It composes the leaf sources (`src/site.mjs`, `src/provenance.mjs`, `src/language-registry.mjs`, `package.json`) instead of duplicating them.

- `CITATION.cff` and `public/rights.json` are generated artifacts. Regenerate with `node scripts/release-metadata.mjs` (the build does this first); `tests/release-metadata.test.mjs` fails on drift.
- Pages, API manifests, MCP specs, citation output and distribution exports derive release/rights/citation values from this module or its leaf sources.
- Semantic rights copy is rendered at build time. Post-render string replacement must never change licensing, citation or capability meaning (`scripts/enhance-licensing-pages.mjs` is limited to presentation metadata on the two static licensing pages).
- CC BY-NC 4.0 appears only as explicit history (pre-2026-08-17 revisions); the release-metadata tests reject it as a current-rights statement.

## URL policy

- Canonical origin: `https://metkagram.github.io`.
- Directory URLs include a trailing slash.
- `/` remains a crawlable interface-language gateway rather than a forced redirect.
- Interface locale is the first segment, currently `/en/` or `/ru/`.
- Learning language is a separate route dimension, currently readable slugs such as `/explore/english/` and `/explore/german/`.
- Future learning-language slugs must come from the language registry rather than hardcoded branch logic.
- Translation locale is normally a learner preference, not a canonical route dimension.
- Existing pattern IDs and compatibility URLs remain stable unless a deliberate redirect migration has a concrete benefit.

Keeping translation locale out of canonical content routes prevents duplicate SEO pages for the same Frame merely because a learner selected another support language.

## Generated discovery artifacts

The public build includes or may derive:

- `sitemap.xml` and `robots.txt`;
- `llms.txt` and project metadata;
- public dataset catalogs and quality reports;
- reasoning/relation datasets;
- `/data/languages.json` — current interface/learning/translation/annotation capabilities;
- `/data/terminology.json` — canonical Metkagram vocabulary and learner-facing surface names;
- `/en/glossary/` and `/ru/glossary/` — human-readable vocabulary pages;
- localized data hubs and agent/API entry points.

Machine-readable surfaces must expose actual capability instead of forcing clients to infer support from the presence of pages.

## Adding a language

A new learning language should not require structural changes to global schemas.

Minimum useful addition:

1. register the language with a stable BCP 47-compatible code and readable slug;
2. enable the capabilities that actually exist;
3. add reviewed Frames/examples;
4. add at least one supported translation locale where product policy requires it;
5. add Bridges where reviewed cross-language relations exist;
6. add annotation only when an annotation profile is ready;
7. add an interface locale only when full product copy is localized.

This allows staged expansion. For example, French could enter Pattern Practice with Russian translations while annotated French reading remains unavailable. The product should state that capability honestly rather than generate decorative empty pages.

## Verification and deployment

The permanent verification workflow runs installation, build/tests and link checks. The terminology/language-foundation build step runs after existing feature generators so it can:

- publish the glossary and capability datasets;
- normalize learner-facing names without changing legacy implementation IDs;
- register glossary routes in sitemap/SEO output.

The main deployment workflow publishes the resulting static `dist/` artifact through GitHub Pages.

## Migration boundary

The multilingual migration is additive:

1. central terminology and language capability registry;
2. translation maps alongside legacy `translation_ru`;
3. explicit language-specific Frame IDs;
4. explicit Move relationships;
5. reviewed Bridge records;
6. new learning languages.

Do not begin with a mass rename of stable public IDs. Domain clarity matters, but breaking every existing reference to achieve naming purity would be a particularly software-shaped form of progress.
