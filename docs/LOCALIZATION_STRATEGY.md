# Localization and language expansion strategy

Metkagram distinguishes three independent language concepts:

1. **Interface locale** — navigation and product instructions. Current values: `en`, `ru`.
2. **Support language** — translations and explanations selected by the learner. English is the default; Russian is currently available for much of the corpus.
3. **Learning language** — the language being studied and annotated. Current values: `en`, `de`.

Keeping these concepts separate prevents a new learning language from requiring a copied interface and lets a learner study English even when their native language is neither English nor Russian.

## Fallback contract

- English is the required source locale for all product UI, metadata, method descriptions and new editorial content.
- A missing interface translation falls back to English and is reported during the build.
- A missing support-language translation shows the English explanation once; it must not duplicate or hide the learning-language sentence.
- Learning content is never machine-translated silently.
- The page `lang`, inline `lang` attributes, canonical URL and hreflang must describe the content actually rendered.
- A localized route is indexable only when its primary title and body are in that locale.

## Data requirements for every new learning language

- BCP 47 language and locale codes.
- Display name, native name and text direction.
- Language-specific annotation guide and allowed tags.
- Canonical UTF-16 span offsets validated against the exact source text.
- Complete formulas, primary examples and multiple natural variations.
- CEFR or another explicit proficiency scale.
- Source, reviewer, dataset version and validation status.
- Support-language translations stored separately from learning-language content.

## Expansion workflow

1. Add language metadata; do not add route-specific conditionals.
2. Create a small representative collection covering Unicode, punctuation, word order and the language's distinctive grammar.
3. Define annotation rules and obtain independent linguistic review.
4. Generate canonical records and migration reports.
5. Run offset, overlap, tag, translation and duplicate-ID validation.
6. Render the same shared sentence and pattern components used by English and German.
7. Test desktop, narrow mobile, keyboard interaction and screen-reader names.
8. Publish coverage and known limitations before scaling the corpus.

## Coverage reporting

Future builds should produce a matrix by interface locale, support language, learning language and field:

- complete;
- English fallback;
- missing and blocking;
- missing and allowed.

The build should fail when a required English source string, learning-language sentence, stable ID, annotation span or canonical metadata is missing. Optional translations may fall back, but the report must make the gap visible.

## Recommended sequence

1. Move product copy from large in-code objects to versioned locale resources.
2. Add automated fallback and coverage tests.
3. Separate Russian translations from pattern records into support-language resources.
4. Pilot one new learning language with 25–50 reviewed patterns.
5. Add new interface locales only when the core product pages can be translated and maintained consistently.
