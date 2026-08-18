# Metkagram language architecture

Status: canonical direction for multilingual expansion.

## Principle

Metkagram must not model “language” as one setting. There are three independent axes:

1. **Interface locale** — language used by navigation, help and product explanations.
2. **Learning language** — language whose Frames and examples the learner is studying.
3. **Translation locale** — support language used for translations and learner-facing glosses.

A fourth capability, **annotation**, is optional. A learning language may have useful Frames, examples and translations before Metkagram has a reviewed Mark/annotation profile for it.

Current state:

- interface locales: English (`en`), Russian (`ru`);
- learning languages: English (`en`), German (`de`);
- translation locale in the canonical pattern data: Russian (`ru`);
- reviewed annotation languages: English (`en`), German (`de`).

The central capability registry lives in `src/language-registry.mjs`.

## Why the axes must stay separate

Russian is currently both an interface language and a translation language, but it is not a learning language in the public curriculum. German is a learning and annotation language, but not an interface language. Future languages may have yet another combination.

Treating these roles as one property creates assumptions such as “every target language must have an annotated corpus” or “every translation language needs a full localized site”. Neither is necessary.

## Language identifiers

Use stable BCP 47-compatible language codes in data (`en`, `de`, `ru`, later `fr`, `es`, `pt-BR`, etc.). Human-readable names and URL slugs are metadata, not identifiers.

Do not derive language logic from strings such as `english`, `german` or field names such as `translation_ru`.

## Current compatibility model

Existing advanced-pattern records contain language realizations inside `langs[]`, and learner translations are stored in fields such as `translation_ru`.

That format remains readable during migration. New code should use the compatibility helper `getTranslation(record, locale)`, which understands both:

```js
{
  translation_ru: "..."
}
```

and the future form:

```js
{
  translations: {
    ru: "...",
    // future support locales can be added without schema surgery
  }
}
```

The goal is additive migration, not a destructive rewrite of every public ID in one release.

## Conceptual model

The long-term model separates language-independent meaning from language-specific realization.

### Move

A Move describes the communicative or reasoning job and has no learning language of its own.

```json
{
  "id": "correct_framing",
  "family": "focus_correction"
}
```

### Frame

A Frame belongs to exactly one learning language and can point to a Move.

```json
{
  "id": "correct_framing.en.not_x_but_y",
  "move_id": "correct_framing",
  "language": "en",
  "formula": "It's not that [X]; it's that [Y].",
  "examples": [
    {
      "text": "It's not that the idea is wrong; it's that it does not scale.",
      "translations": {
        "ru": "Дело не в том, что идея неверна; дело в том, что она не масштабируется."
      }
    }
  ]
}
```

### Bridge

A Bridge relates reviewed Frames across learning languages. It makes cross-language correspondence explicit instead of assuming that two entries under one record are interchangeable.

```json
{
  "id": "correct_framing.en-de.1",
  "move_id": "correct_framing",
  "from_frame": "correct_framing.en.not_x_but_y",
  "to_frame": "correct_framing.de.nicht_dass_vielmehr",
  "relation": "functional_near_equivalent",
  "review_status": "reviewed"
}
```

Recommended relation vocabulary:

- `functional_equivalent`
- `functional_near_equivalent`
- `context_limited`
- `contrastive`

A missing Bridge is valid. Languages are not obliged to provide neat one-to-one symmetry for the convenience of a JSON schema.

## Annotation capability

Annotation belongs to a language profile, not to the definition of a Frame.

A future language can therefore progress through these states:

1. translations only;
2. reviewed Frames and examples;
3. Bridges to existing Moves/Frames;
4. optional annotation profile and annotated reading sets;
5. optional localized interface.

This order lets Metkagram expand without requiring a new spaCy pipeline or full grammar notation before a language becomes useful.

## URL policy

Keep the current public URLs stable.

- interface locale remains the first segment, currently `/en/` or `/ru/`;
- learning-language slugs remain readable routes such as `/explore/english/` and `/explore/german/`;
- new learning-language routes must be generated from the language registry rather than hardcoded conditionals;
- translation locale should normally be a user preference, not part of the canonical content URL.

The last rule avoids creating separate SEO copies of the same Frame merely because the learner wants a different translation language.

## Public language matrix

The build should expose a small machine-readable language matrix at `/data/languages.json`. It tells clients which roles each language currently supports without forcing them to infer capabilities from available pages.

Example:

```json
{
  "languages": {
    "en": { "roles": { "interface": true, "learning": true, "translation": false, "annotation": true } },
    "de": { "roles": { "interface": false, "learning": true, "translation": false, "annotation": true } },
    "ru": { "roles": { "interface": true, "learning": false, "translation": true, "annotation": false } }
  }
}
```

## Migration sequence

### Phase 1 — foundation

- central language capability registry;
- canonical terminology and glossary;
- publish `/data/languages.json`;
- keep existing IDs and URLs stable.

### Phase 2 — translations

- allow `translations: { locale: text }` everywhere translations appear;
- keep `translation_ru` as a read-compatible legacy field until source data is migrated;
- move UI labels out of target-language conditionals.

### Phase 3 — Frame/Move separation

- introduce stable Frame IDs per learning language;
- retain current pattern IDs as learner-facing compatibility IDs;
- make Move relations explicit;
- validate that each Frame has exactly one source language.

### Phase 4 — Bridges

- replace assumptions of same-record EN↔DE equivalence with reviewed Bridge records;
- preserve relation type and review status;
- let one Move have zero, one or several Frames per language.

### Phase 5 — new learning language

Adding a language should require:

1. one registry entry;
2. Frames/examples for that language;
3. translations in at least one enabled translation locale;
4. optional Bridges;
5. optional annotation profile;
6. no changes to global schema structure.

## Acceptance rule for future languages

A language is useful before it is complete. Metkagram should expose the capabilities it actually has instead of hiding a language until every product surface can support it.

That means, for example, French can initially appear in Pattern Practice with Russian translations while Annotated Language remains unavailable for French. The UI should explain the capability honestly rather than fabricate empty annotation pages.
