# SEO and discoverability

SEO is generated from the same route templates as the visible content. Every HTML page receives:

- a unique, concise title and description;
- a production canonical URL;
- index/follow policy, except the 404 page;
- English, Russian and x-default alternates where equivalent localized pages exist;
- Open Graph and Twitter preview metadata;
- a page-level Schema.org entity with language, description, canonical URL, image and modification date;
- route-specific structured data such as `LearningResource`, `ItemList`, `Dataset`, `DataCatalog`, `FAQPage`, `ResearchProject` and breadcrumbs.

The build also produces:

- `/sitemap.xml` with canonical URLs and meaningful `lastmod` values;
- `/robots.txt` with the sitemap location;
- `/seo/site-pages.json`, an auditable inventory of route, canonical, language, title, description and modification date;
- `/llms.txt`, static API documentation and record-level provenance for agent discovery;
- `/en/data/` and `/ru/data/` human-readable dataset directories with `Dataset` / `DataCatalog` structured data;
- `/data/quality-report.json`, which exposes editorial quality signals without making efficacy claims.

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
- Preserve the core product story: sentence → visible structure → reusable pattern → variation → recall.
- Do not claim efficacy, audience size or commercial traction without evidence.
- Keep URLs stable; add redirects when a public route changes.
- Link new pages from visible navigation or a relevant hub on mobile and desktop.
- Prefer a smaller number of strong, connected pages over mechanically generated near-duplicates.

## Dataset SEO

The dataset directory exists for both humans and machines. Dataset landing pages should expose:

- a plain-language description;
- scope and language coverage;
- canonical downloads;
- version and attribution;
- `Dataset` or `DataCatalog` JSON-LD;
- links back to the API/MCP documentation.

Raw JSON remains the canonical machine-readable export; landing pages explain what the data means and why it exists.

## Verification

Run:

```sh
npm run verify
npm run test:e2e
```

Automated tests inspect all generated HTML, not only representative routes. They enforce title and description limits, canonical origin, branded previews, crawl directives, page-level structured data, sitemap coverage, dataset pages, quality metadata and internal-link validity.

Pull requests and `agent/**` branches run the `Verify` GitHub Actions workflow so build, tests and link validation happen before merge.
