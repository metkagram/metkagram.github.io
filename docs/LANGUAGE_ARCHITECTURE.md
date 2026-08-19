# Metkagram language architecture

Status: canonical architecture; Phase 3 foundation and reviewed Bridge projection are implemented.

## Principle

Metkagram does not model “language” as one setting. Four capabilities are independent:

1. **Interface locale** — navigation, help and product explanations.
2. **Learning language** — language whose Frames and examples are studied.
3. **Translation locale** — support language used for translations and learner-facing glosses.
4. **Annotation capability** — reviewed Metkagram Marks/annotation for that language.

A learning language does not need annotation or a localized interface to be useful.

Current state:

- interface: English (`en`), Russian (`ru`);
- learning: English (`en`), German (`de`);
- translation: Russian (`ru`);
- annotation: English (`en`), German (`de`).

The capability registry lives in `src/language-registry.mjs` and is published at `/data/languages.json`.

## Domain model

The normalized multilingual knowledge layer is:

**Move → Frame → Bridge**

`Pattern` remains the stable public umbrella and compatibility ID. Existing pattern URLs and datasets do not need to change.

The build now publishes:

- `/data/domain/index.json` — model manifest and invariants;
- `/data/domain/moves.json` — language-independent Moves;
- `/data/domain/frames.json` — language-specific Frames;
- `/data/domain/bridges.json` — reviewed cross-language Bridges;
- `/data/domain/pattern-index.json` — stable pattern ID → Frame/Move mapping.

Equivalent API resources are published under `/api/v1/` and exposed through MCP.

### Move

A Move is the communicative or reasoning job. It has no learning language.

```json
{
  "id": "move:reframe",
  "kind": "move",
  "name": "Reframe",
  "language": null,
  "language_independent": true
}
```

One Move may be realised by many patterns and Frames. Not every historical pattern has an explicit Move yet; that is valid and can be enriched incrementally.

### Frame

A Frame belongs to exactly one learning language.

```json
{
  "id": "frame:clf061:en",
  "pattern_id": "CLF061",
  "move_id": "move:reframe",
  "language": "en",
  "formula": "It's not that [X]; it's that [Y].",
  "translations": {
    "ru": "..."
  }
}
```

A future French Frame can therefore exist with `language: "fr"` even when French has no annotation profile and no French interface.

### Bridge

A Bridge is an explicit reviewed relation between two Frames in different learning languages.

```json
{
  "id": "bridge:clf061:en-de",
  "pattern_id": "CLF061",
  "move_id": "move:reframe",
  "from_frame_id": "frame:clf061:en",
  "to_frame_id": "frame:clf061:de",
  "relation": "functional_near_equivalent",
  "review_status": "reviewed",
  "literal_equivalence": false
}
```

The crucial rule is negative: **a Bridge is not inferred just because two strings look similar or because a new language was added to a pattern record**.

The current EN↔DE Bridge dataset is projected from the existing reviewed Cross-language Transfer mappings. A missing Bridge is meaningful and valid.

## Pattern compatibility layer

The public pattern ID remains stable because it already anchors URLs, study sets, contrasts, exports and external references.

The normalized layer therefore adds, rather than replaces:

```json
{
  "pattern_id": "CLF061",
  "move_id": "move:reframe",
  "frame_ids": {
    "en": "frame:clf061:en",
    "de": "frame:clf061:de"
  }
}
```

This lets old clients continue using pattern IDs while new clients can reason explicitly about language-specific Frames.

## Translation model

New data should use locale maps:

```json
{
  "translations": {
    "ru": "..."
  }
}
```

During migration, `normalizeTranslations()` and `getTranslation()` also understand legacy fields such as:

```json
{
  "translation_ru": "..."
}
```

and the older `translation` field inside language-realisation records, where Russian is the historical support locale.

Translation is not a Frame and not a Bridge. A Russian translation of an English example does not make Russian a learning language.

## Annotation is optional

Annotation belongs to a language capability, not to the definition of a Frame.

A language may progress through these states:

1. registry entry with `learning=true`;
2. reviewed Frames and examples;
3. translations in an enabled support locale;
4. optional reviewed Bridges;
5. optional annotation profile and annotated reading sets;
6. optional localized interface.

This order deliberately avoids requiring a new spaCy/NLP pipeline before a language can appear in Pattern Practice or machine-readable data.

## Language identifiers

Use stable BCP 47-compatible codes (`en`, `de`, `ru`, later `fr`, `es`, `pt-BR`, etc.). Slugs and display names are metadata.

Do not derive capability logic from strings such as `english`, `german` or field names such as `translation_ru`.

## Current compatibility boundary

The base annotated-collection renderer still contains historical EN/DE target metadata. Treat that as a compatibility adapter for the existing annotated corpus, not as the canonical language registry.

This distinction matters: adding a Frame-only learning language must not require adding an empty annotated collection. The normalized domain layer already supports that separation; the annotated collection renderer can be migrated independently later.

## Adding another language

The operational checklist lives in `docs/ADDING_A_LANGUAGE.md`.

The acceptance rule is simple: a language is useful before it is complete. Expose the capabilities it actually has, and do not fabricate unsupported annotation, translation or Bridge coverage.

## Migration status

### Phase 1 — foundation: implemented

- central capability registry;
- canonical terminology and glossary;
- `/data/languages.json`;
- stable existing IDs and URLs.

### Phase 2 — translations: compatibility implemented, source migration ongoing

- locale-map helper is available;
- legacy Russian fields remain readable;
- future translations do not require schema-specific `translation_xx` fields.

### Phase 3 — Frame/Move separation: implemented as normalized sidecar datasets

- stable Frame IDs per language;
- language-independent Move IDs;
- complete pattern compatibility index;
- source pattern dataset remains unchanged.

### Phase 4 — Bridges: implemented for reviewed EN↔DE mappings

- reviewed mappings become explicit Bridge records;
- missing Bridges remain missing;
- no lexical-similarity inference.

### Phase 5 — new learning language: architecture ready

A new language should require data and registry changes, not a global schema redesign. Annotation and interface support remain optional later steps.
