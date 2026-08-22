# Metkagram SEO and content system

## Product vocabulary

| Product object | English | Русский | Meaning |
|---|---|---|---|
| Marked source material | Annotation | Разметка | A phrase with token-level functional marks |
| Reusable structure | Pattern | Паттерн | A structure that transfers to a new sentence |
| Curated group | Topic set | Тематический сет | Patterns collected around one communication or grammar task |
| Ordered progression | Learning path | Учебный маршрут | Several topic sets in a useful sequence |

Use the short labels **Annotations**, **Patterns**, **Method**, **For AI** in English navigation and **Разметка**, **Паттерны**, **Метод**, **Для ИИ** in Russian. Longer library names belong in page headings, breadcrumbs and search metadata.

## Core journey

`Landing → Annotation or Pattern Library → Topic set → Pattern → Related set`

Each transition names the object the visitor will open. Avoid generic actions such as “Explore,” “Learn” and “Discover” when a concrete noun is available.

## URL contract

- Topic-set canonical: `/{locale}/practice/sets/{english-topic-slug}/`
- Pattern canonical: `/{locale}/practice/patterns/{frozen-english-structure-slug}-{stable-pattern-id}/`
- Annotation library: `/{locale}/explore/`
- Legacy set route: `/{locale}/practice/set/{id}/` with a canonical and immediate transition to the topic slug.
- Legacy pattern route: `/{locale}/practice/{id}/` with a canonical and immediate transition to the descriptive pattern URL.

Slug cores are lowercase ASCII, hyphen-separated and shared by EN/RU so language switching preserves the route. Topic-set cores start from the English topic title; pattern cores start from the English structure formula and end with the immutable pattern ID. Every core is frozen in `data/seo-slugs.json`: editing a title, formula or translation never changes a published URL. IDs remain in datasets and visible metadata; for patterns the ID suffix also guarantees URL uniqueness.

Run `npm run seo:slugs` after adding new topic sets or patterns. The generator preserves every existing registry value and creates entries only for new IDs. Review the new cores before publishing; do not regenerate or hand-edit an already published slug merely to improve wording.

## Search landing-page contract

Every topic-set page includes:

1. A unique search-oriented title and description.
2. Canonical, EN/RU hreflang and social metadata.
3. Breadcrumb and `LearningResource` structured data.
4. One clear communication or grammar outcome.
5. A short “how to use this set” section.
6. Representative patterns before the complete list.
7. Related sets from the same learning path.
8. Server-rendered content and internal links.

Titles describe the search need, for example “Hedging Phrases for C1 English,” rather than exposing only an internal category name. Descriptions state the outcome, pattern count and available language context without keyword repetition.

## Copy rules

- Start with the learner’s job: argue, clarify, ask, compare, negotiate.
- Use one canonical term per object; do not alternate “set,” “collection,” “pack” and “course.”
- Do not claim ranking, guaranteed learning outcomes or unsupported corpus coverage.
- Keep titles below 70 characters and descriptions between 70 and 160 characters.
- A page must remain useful even when entered directly from search.

## Structured-data graph contract

- `Organization` and `WebSite` use the stable IDs `/#organization` and `/#website`.
- Every indexable page has one `{canonical}#webpage` entity connected to `/#website` and the publisher.
- A visible `LearningResource`, `Dataset` or `DataCatalog` uses a type-specific stable `@id`, points back through `mainEntityOfPage`, and is referenced by the page through `mainEntity`.
- Pattern resources keep the immutable pattern ID in `identifier` and link to their canonical topic set through `isPartOf`.
- Breadcrumbs describe real navigable hierarchy only. Structural URL segments such as `patterns`, `sets` and `legal` are not emitted as nonexistent breadcrumb destinations.
- Open Graph and Twitter cards use the canonical URL and the shared 1200×630 preview with complete titles, descriptions and image alt text.
- Do not publish structured-data types only to chase a search feature. The marked entity must be real and represented in visible page content.

## Release checks

Run `npm run seo:slugs` when the corpus changes, then `npm run verify`. The full verification rebuilds the site, runs the test suite, checks internal links and audits every indexable page for complete social metadata, canonical sitemap coverage, connected JSON-LD entities, real breadcrumb destinations and pattern-graph integrity.
