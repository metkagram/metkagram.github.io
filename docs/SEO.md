# SEO and discoverability

SEO is generated from the same route templates as the visible content. Every HTML page receives:

- a unique, concise title and description;
- a production canonical URL;
- index/follow policy, except the 404 page;
- English, Russian and x-default alternates where equivalent localized pages exist;
- Open Graph and Twitter preview metadata;
- a page-level Schema.org entity with language, description, canonical URL, image and modification date;
- route-specific structured data such as `LearningResource`, `ItemList`, `Dataset`, `DataCatalog`, `ResearchProject` and breadcrumbs.

The build also produces:

- `/sitemap.xml` with canonical URLs and meaningful `lastmod` values;
- `/robots.txt` with the sitemap location;
- `/seo/site-pages.json`, an auditable inventory of route, canonical, language, title, description and modification date;
- `/llms.txt`, static API documentation and record-level provenance for agent discovery;
- `/en/data/` and `/ru/data/` human-readable dataset directories with `Dataset` / `DataCatalog` structured data;
- `/data/quality-report.json`, which exposes editorial quality signals without making efficacy claims;
- `/data/discovery-topics.json`, the curated learner-task layer used by Pattern Atlas;
- `/seo/discovery-topics.json`, an auditable inventory of the Pattern Atlas routes.

## 2026 search principles

Metkagram follows the same principle for classic search and generative-AI search: useful, original, indexable content first; machine metadata second.

Google's current guidance states that AI Overviews and AI Mode do not require special AI schema or extra machine-readable text files. Existing SEO fundamentals remain the foundation: crawlability, internal links, useful textual content, good page experience and structured data that matches visible content.

Relevant official guidance:

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials

`llms.txt`, OpenAPI and MCP remain useful to agents and developers, but they are not treated as Google ranking shortcuts.

Google deprecated FAQ rich results in May 2026. FAQ-like visible content may still be useful to readers, but the project does not rely on `FAQPage` markup as a search-growth mechanism.

## Pattern Atlas: semantic discovery layer

The corpus contains thousands of stable pattern records, but learners usually search by a communication problem rather than an internal pattern ID. Pattern Atlas bridges that gap without creating one page for every possible query wording.

Source: `data/discovery-topics.json`.

Generated routes:

- `/{locale}/patterns/`;
- `/{locale}/patterns/{editorial-topic}/`.

A topic is eligible only when it:

- represents a real learner job such as hedging, disagreement, conditionals or professional communication;
- maps to existing validated study sets;
- contains enough reviewed patterns to provide substantial value;
- can show visible examples from canonical pattern records;
- links onward to study sets and individual patterns;
- has related-topic links that reflect a meaningful learning path.

Do not generate topic pages from raw query permutations. Search terms are evidence for editorial prioritisation, not page templates.

## Content quality and indexability

Programmatic scale is acceptable only when each page has real instructional value. Pattern count is not a quality metric.

- Do not create examples merely to reach a fixed count.
- Every learning-language record requires a formula, primary example, translation and at least two genuine variations.
- Pattern quality metadata records unique-example counts and translation completeness by language.
- A pattern is considered structurally indexable when translations are complete and each language has at least three unique examples including the primary example.
- `data/quality-report.json` is the review queue for records that fall below the quality threshold.
- Future rendering changes may map `quality.indexable=false` to `noindex,follow`; the quality signal is deliberately kept independent from the renderer so editorial policy can evolve without rewriting source data.

## Dates and versions

- `SITE_RELEASE_DATE` is the editorial release date for a meaningful site release, not the date a build happened to run.
- Dataset versions are content-derived: package version plus a deterministic fingerprint of canonical JSON data.
- Rebuilding identical content must not create a new dataset version.
- Pattern sitemap dates may use the pattern's curated generation date when present; other pages use the current verified site release date.
- Update release metadata only for substantial user-visible, structured-data or discovery changes.

## Editorial rules

- Write titles in the primary language of the page.
- Describe the actual learning resource; do not repeat keyword lists.
- Keep one prominent `h1` aligned with the title's intent.
- Use the words learners naturally use when they accurately describe the visible resource.
- Preserve the core product story: sentence → visible structure → reusable pattern → variation → recall.
- Do not claim efficacy, audience size or commercial traction without evidence.
- Keep URLs stable; add redirects when a public route changes.
- Link new pages from visible navigation or a relevant hub on mobile and desktop.
- Prefer a smaller number of strong, connected pages over mechanically generated near-duplicates.
- Use automation to find gaps and propose mappings; publish reviewed relationships.

## Internal-link architecture

The preferred discovery path is:

`learner task / intent → Pattern Atlas topic → study set → canonical pattern → examples / related records`

Machine discovery extends the same graph:

`agent capability → intent / topic → canonical record → provenance → API / MCP`

Avoid orphan pages. A new public route must be reachable from a relevant visible hub in addition to being present in the sitemap.

## Dataset SEO

The dataset directory exists for both humans and machines. Dataset landing pages should expose:

- a plain-language description;
- scope and language coverage;
- canonical downloads;
- version and attribution;
- `Dataset` or `DataCatalog` JSON-LD;
- links back to the API/MCP documentation.

Raw JSON remains the canonical machine-readable export; landing pages explain what the data means and why it exists.

## Crawl notification

IndexNow is a useful optional notification channel for participating search engines. It is not an indexing or ranking guarantee.

If enabled:

- submit only URLs that were added, materially updated or deleted;
- keep the verification key outside source control when possible and expose only the required verification file at deploy time;
- batch changed URLs rather than resubmitting the complete corpus on every build;
- verify receipt in Bing Webmaster Tools.

Reference: https://www.indexnow.org/documentation

Google discovery continues through normal crawling, sitemap submission and Search Console workflows.

## Measurement

Measure performance by route type rather than treating the site as one number:

- Pattern Atlas topic hubs;
- study sets;
- individual patterns;
- annotated documents;
- method/research pages;
- API/developer pages.

Track:

- non-brand impressions and clicks;
- CTR;
- crawl/index coverage by route type;
- query clusters that map to a real learner task;
- pages with impressions but weak engagement;
- pages crawled repeatedly without meaningful search visibility;
- generative-AI search visibility when the corresponding Search Console report is available to the property.

Use Search Console evidence to decide what to expand, consolidate or noindex. Do not guess based on raw page count.

## Verification

Run:

```sh
npm run verify
npm run test:e2e
```

Automated tests inspect all generated HTML, not only representative routes. They enforce title and description limits, canonical origin, branded previews, crawl directives, page-level structured data, sitemap coverage, dataset pages, quality metadata and internal-link validity.

Pull requests and `agent/**` branches run the `Verify` GitHub Actions workflow so build, tests and link validation happen before merge.

The broader product/distribution plan is documented in `docs/GROWTH_STRATEGY.md`.
