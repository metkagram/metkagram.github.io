# Metkagram language architecture

Status: canonical architecture; the first Frame-only third-language pilot is implemented with French.

## Principle

Metkagram does not model “language” as one setting. Four capabilities are independent:

1. **Interface locale** — navigation, help and product explanations.
2. **Learning language** — language whose Frames and examples are studied.
3. **Translation locale** — support language used for translations and learner-facing glosses.
4. **Annotation capability** — reviewed Metkagram Marks/annotation for that language.

A learning language does not need annotation or a localized interface to be useful.

Current state:

- interface: English (`en`), Russian (`ru`);
- learning: English (`en`), German (`de`), French (`fr`, pilot);
- translation: Russian (`ru`);
- annotation: English (`en`), German (`de`);
- French status: `learning=true`, `annotation=false`, `interface=false`.

The capability registry lives in `src/language-registry.mjs` and is published at `/data/languages.json`.

## Domain model

The normalized multilingual knowledge layer is:

**Move → Frame → Bridge**

`Pattern` remains the stable public umbrella and compatibility ID. Existing pattern URLs and the historical EN/DE pattern dataset remain stable.

The build publishes:

- `/data/domain/index.json` — model manifest and invariants;
- `/data/domain/moves.json` — language-independent Moves;
- `/data/domain/frames.json` — language-specific Frames;
- `/data/domain/bridges.json` — reviewed cross-language Bridges;
- `/data/domain/pattern-index.json` — stable pattern ID → Frame/Move mapping;
- `/data/domain/language-pilots.json` — capability and coverage metadata for Frame-only pilot languages.

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

### Frame

A Frame belongs to exactly one learning language.

```json
{
  "id": "frame:clf061:fr",
  "pattern_id": "CLF061",
  "move_id": "move:reframe",
  "language": "fr",
  "formula": "Ce n’est pas que [X] ; c’est que [Y].",
  "translations": {
    "ru": "..."
  },
  "source_kind": "language_extension",
  "source_status": "editorial_pilot"
}
```

Frame extensions are additive. They do not require rewriting the historical pattern record, which still contains its established EN/DE realizations.

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

The crucial rule is negative: **a Bridge is not inferred because two Frames share a pattern ID, look similar, or came from machine translation**.

The current EN↔DE Bridge dataset is projected from reviewed Cross-language Transfer mappings. The French pilot intentionally starts with **zero reviewed French Bridges**. A missing Bridge is meaningful and valid.

## French pilot

The first real test of the architecture lives in `data/language-pilots/french-v1.json`.

It contains:

- 20 French Frames attached to existing canonical Pattern IDs and Moves;
- 60 French examples in total;
- Russian support translations;
- explicit internal-editorial review metadata;
- no French annotation profile;
- no French interface locale;
- no implied EN↔FR or DE↔FR Bridge.

Human pilot pages are generated at:

- `/en/practice/language/french/`;
- `/ru/practice/language/french/`.

This is deliberately labelled a pilot. The current editorial check is not presented as native-speaker certification.

## Pattern compatibility layer

The public pattern ID remains stable because it already anchors URLs, study sets, contrasts, exports and external references.

A pilot parent can therefore resolve to three Frames without changing the canonical Pattern URL:

```json
{
  "pattern_id": "CLF061",
  "move_id": "move:reframe",
  "frame_ids": {
    "de": "frame:clf061:de",
    "en": "frame:clf061:en",
    "fr": "frame:clf061:fr"
  }
}
```

Old clients can continue using pattern IDs. New clients can reason about language-specific Frames.

## Translation model

New data uses locale maps:

```json
{
  "translations": {
    "ru": "..."
  }
}
```

During migration, `normalizeTranslations()` and `getTranslation()` also understand legacy fields such as `translation_ru` and the historical `translation` field.

Translation is not a Frame and not a Bridge. A Russian translation of a French example does not make Russian a learning language.

## Annotation is optional

Annotation belongs to a language capability, not to the definition of a Frame.

French demonstrates the intended progression in production data:

1. registry entry with `learning=true`;
2. reviewed pilot Frames and examples;
3. translations in an enabled support locale;
4. later, optionally, reviewed Bridges;
5. later, optionally, annotation profile and annotated reading sets;
6. later, optionally, localized interface.

No empty `/explore/french/` annotation collection is created merely for symmetry.

## Language identifiers

Use stable BCP 47-compatible codes (`en`, `de`, `fr`, `ru`, later `es`, `pt-BR`, etc.). Slugs and display names are metadata.

Do not derive capability logic from strings such as `english`, `german` or field names such as `translation_ru`.

## Compatibility boundary

The base annotated-collection renderer still contains historical EN/DE target metadata. Treat that as a compatibility adapter for the annotated corpus, not as the canonical language registry.

The pattern-corpus validation (`src/content.mjs` over the `data/patterns/` shards) also remains EN/DE-oriented. New learning-language Frames therefore enter through the additive language-extension layer rather than forcing a risky rewrite of thousands of stable records.

## Adding another language

The operational checklist lives in `docs/ADDING_A_LANGUAGE.md`.

The acceptance rule is simple: a language is useful before it is complete. Expose only the capabilities it actually has.

## Migration status

### Phase 1 — foundation: implemented

- central capability registry;
- canonical terminology and glossary;
- `/data/languages.json`;
- stable existing IDs and URLs.

### Phase 2 — translations: compatibility implemented, source migration ongoing

- locale-map helper available;
- legacy Russian fields remain readable;
- new pilot data uses `translations: { locale: text }`.

### Phase 3 — Frame/Move separation: implemented

- stable Frame IDs per learning language;
- language-independent Move IDs;
- complete pattern compatibility index;
- additive Frame-extension support.

### Phase 4 — Bridges: implemented for reviewed EN↔DE mappings

- reviewed mappings become explicit Bridge records;
- missing Bridges remain missing;
- no lexical-similarity inference.

### Phase 5 — new learning language: implemented as French pilot

French proves that a third learning language can ship useful Frames without annotation or interface localization. The next quality step is independent French review and then a deliberately small set of EN↔FR / DE↔FR Bridge candidates.
