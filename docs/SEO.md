# SEO and discoverability

SEO is generated from the same route templates as the visible content. Every HTML page receives:

- a unique, concise title and description;
- a production canonical URL;
- index/follow policy, except the 404 page;
- English, Russian and x-default alternates where equivalent localized pages exist;
- Open Graph and Twitter preview metadata;
- a page-level Schema.org entity with language, description, canonical URL, image and modification date;
- route-specific structured data such as `LearningResource`, `ItemList`, `Dataset`, `FAQPage`, `ResearchProject` and breadcrumbs.

The build also produces:

- `/sitemap.xml` with canonical URLs and a verified release `lastmod`;
- `/robots.txt` with the sitemap location;
- `/seo/site-pages.json`, an auditable inventory of route, canonical, language, title and description;
- `/llms.txt`, static API documentation and record-level provenance for agent discovery.

## Editorial rules

- Write titles in the primary language of the page.
- Describe the actual learning resource; do not repeat keyword lists.
- Keep one prominent `h1` aligned with the title's intent.
- Do not claim efficacy, audience size or commercial traction without evidence.
- Keep URLs stable; add redirects when a public route changes.
- Link new pages from visible navigation on mobile and desktop.

## Verification

Run:

```sh
npm run verify
npm run test:e2e
```

Automated tests inspect all generated HTML, not only representative routes. They enforce title and description limits, canonical origin, branded previews, crawl directives, page-level structured data, sitemap coverage and internal-link validity.
