# Adding a learning language to Metkagram

This is the operational playbook for adding another learning language without coupling it to interface localization or sentence annotation.

The first production use of this architecture is the French Frame pilot in `data/language-pilots/french-v1.json`.

## 1. Register the capability honestly

Add the language to `src/language-registry.mjs` with a stable BCP 47-compatible code and an explicit maturity status.

The French pilot starts as:

```js
fr: {
  code: "fr",
  slug: "french",
  nativeName: "Français",
  direction: "ltr",
  status: "pilot",
  roles: {
    interface: false,
    learning: true,
    translation: false,
    annotation: false,
  },
}
```

Do not enable a role merely because it may exist later.

## 2. Add Frames through the language-extension layer

Do not rewrite the historical EN/DE canonical pattern objects just to add a new language.

Add reviewed language realizations under `data/language-pilots/`. Each extension must reference an existing stable `pattern_id` and therefore inherits the canonical Move from that parent.

A pilot Frame must have:

- one enabled learning-language code;
- an existing canonical `pattern_id`;
- a reusable formula;
- one primary natural example;
- at least two additional examples;
- translations in an enabled support locale where available;
- explicit editorial-review metadata;
- a truthful source status such as `editorial_pilot`.

The normalized build exposes IDs such as:

`frame:clf061:fr`

No French interface or annotation collection is required for that Frame to exist.

## 3. Store translations by locale

Use:

```json
{
  "translations": {
    "ru": "..."
  }
}
```

Do not introduce new schema fields such as `translation_fr`, `translation_es`, etc. Legacy Russian fields remain readable only for compatibility with older source records.

Translation locale and learning language are independent. A Russian translation does not create a Russian Frame.

## 4. Review Bridges separately

Do not create a Bridge from lexical similarity, a shared Pattern ID or machine translation alone.

A Bridge should be added only after checking that two Frames perform the same or a deliberately related communicative job in the relevant contexts.

Required properties:

- source Frame;
- target Frame;
- relation type;
- review status;
- review basis;
- `literal_equivalence: false` unless a future methodology defines and validates a stronger relation.

A language may launch with zero Bridges. French deliberately does.

## 5. Add annotation only when it has value

Annotation is a later capability. Add it when there is a reviewed Mark profile, usable parsing/annotation workflow and enough reading material to justify the surface.

Only then set:

```js
annotation: true
```

and add corresponding annotated collections.

Do not create empty `/explore/<language>/` sections merely to make the language matrix look symmetrical.

## 6. Add interface localization separately

A learning language does not need to become an interface locale.

If a localized interface is eventually useful, translate navigation/help copy and only then set:

```js
interface: true
```

Interface locale belongs to product localization, not language-learning content.

## 7. Publish an honest learner surface

A Frame-only pilot should still be usable by people, not only by JSON consumers.

French is exposed at:

- `/en/practice/language/french/`;
- `/ru/practice/language/french/`.

The page states what exists and what does not exist. It must not imply annotation coverage or reviewed cross-language equivalence that has not been built.

## 8. Validate before publication

Run:

```bash
npm run verify
```

The multilingual tests must confirm:

- every Frame language is registered and enabled for learning;
- Move objects remain language-independent;
- translation locales are explicitly enabled;
- language extensions reference existing canonical patterns;
- extension Frames carry review metadata and enough examples;
- every Bridge points to two real Frames in different languages;
- no unreviewed Bridge is published;
- existing pattern IDs and URLs remain stable;
- pilot pages are generated and internally linked correctly.

## Recommended rollout

For a new language, prefer a narrow reviewed pilot over bulk machine-generated coverage:

1. select 20–50 high-value Frames;
2. write natural examples;
3. add support-language translations;
4. publish and test Frame retrieval;
5. request independent/native-language review;
6. review a smaller number of Bridge candidates;
7. expand only when quality is stable;
8. consider annotation later.

The French v1 pilot uses **20 Frames and 60 examples**. It is intentionally small enough to inspect and improve rather than large enough to impress a dashboard.

The objective is not “support N languages” as a badge. The objective is to preserve the Metkagram method while making each new language genuinely reusable.
