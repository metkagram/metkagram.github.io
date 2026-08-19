# Adding a learning language to Metkagram

This is the operational playbook for adding another learning language without coupling it to interface localization or sentence annotation.

## 1. Register the capability honestly

Add the language to `src/language-registry.mjs` with a stable BCP 47-compatible code.

For a Frame-only launch, the normal starting point is:

```js
fr: {
  code: "fr",
  slug: "french",
  nativeName: "Français",
  direction: "ltr",
  roles: {
    interface: false,
    learning: true,
    translation: false,
    annotation: false,
  },
}
```

Do not enable a role merely because it may exist later.

## 2. Add Frames, not fake annotated collections

Add a language realisation only where a reviewed reusable Frame exists.

A Frame must have:

- one learning-language code;
- a reusable formula;
- at least one natural example;
- translations in an enabled support locale where available;
- the existing stable pattern ID as its compatibility parent.

The normalized build will expose an ID such as:

`frame:clf061:fr`

No French interface or annotation route is required for that Frame to exist.

## 3. Store translations by locale

Prefer:

```json
{
  "translations": {
    "ru": "..."
  }
}
```

Do not introduce new schema fields such as `translation_fr`, `translation_es`, etc. Legacy Russian fields remain readable only for compatibility.

Translation locale and learning language are independent. A Russian translation does not create a Russian Frame.

## 4. Review Bridges explicitly

Do not create a Bridge from lexical similarity or machine translation alone.

A Bridge should be added only after checking that two Frames perform the same or a deliberately related communicative job in the relevant contexts.

Required properties:

- source Frame;
- target Frame;
- relation type;
- review status;
- review basis;
- `literal_equivalence: false` unless a future methodology defines and validates a stronger relation.

A language may launch with zero Bridges.

## 5. Add annotation only when it has value

Annotation is a later capability. Add it when there is a reviewed Mark profile, usable parsing/annotation workflow and enough reading material to justify the surface.

Only then set:

```js
annotation: true
```

and add the corresponding annotated collections.

Do not create empty `/explore/<language>/` sections merely to make the language matrix look symmetrical.

## 6. Add interface localization separately

A learning language does not need to become an interface locale.

If a localized interface is eventually useful, translate navigation/help copy and only then set:

```js
interface: true
```

Interface locale belongs to product localization, not language-learning content.

## 7. Validate before publication

Run:

```bash
npm run verify
```

The multilingual tests must confirm:

- every Frame language is registered and enabled for learning;
- Move objects remain language-independent;
- translation locales are explicitly enabled;
- every Bridge points to two real Frames in different languages;
- no unreviewed Bridge is published;
- existing pattern IDs and URLs remain stable.

## Recommended rollout

For a new language, prefer a narrow reviewed pilot over bulk machine-generated coverage:

1. select 20–50 high-value Frames;
2. write natural examples;
3. add support-language translations;
4. publish and test Frame retrieval;
5. review a smaller number of Bridges;
6. expand only when quality is stable;
7. consider annotation later.

The objective is not “support N languages” as a badge. The objective is to preserve the Metkagram method while making each new language genuinely reusable.
