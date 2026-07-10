# Architecture

## Decision

Metkagram uses a small Node.js static generator instead of a client-only SPA or server framework. The source product was Next.js, but its public learning content and practice logic do not require server rendering. Direct generation preserves crawlable HTML, makes all Pages paths deterministic, and avoids shipping a framework runtime for thousands of content pages.

## Layers

1. **Canonical content** — source JSON in `data/` holds all English/German annotated documents and advanced patterns. Interface translations are separate in `src/i18n.mjs`.
2. **Validation and loading** — `src/content.mjs` checks required identifiers, titles, annotations, learning-language records, uniqueness and index/document parity. Invalid records fail the build.
3. **Static rendering** — `src/render.mjs` owns shared layout, localized navigation, metadata, hreflang, structured data and every page type. `scripts/build.mjs` writes directory-style URLs to `dist/`.
4. **Progressive enhancement** — `public/assets/app.js` adds filters, mobile navigation, SRS review, progress, sync and export/import. Core content and links remain useful without JavaScript.
5. **Persistence** — `public/assets/srs-core.js` preserves the MetkaX scheduling algorithm and legacy keys, adds a version-2 export envelope, and merges sync snapshots by the most recent review timestamp.
6. **Compatibility backend** — GitHub Pages hosts no server functions. Existing sync codes continue through the retained `https://metalhatscats.com/api/metkax/srs` Vercel API with production-origin CORS.

## URL policy

- Canonical origin: `https://metkagram.github.io`.
- Directory URLs always include a trailing slash.
- `/` is a crawlable language gateway, not a forced redirect.
- Interface locale is the first segment: `/en/` or `/ru/`.
- Learning language is the next relevant segment: `/explore/english/` or `/explore/german/`.
- Advanced pattern IDs are canonicalized to lowercase in new URLs.

The locale switcher changes only the first segment, preserving the target language, collection and detail ID.

## Generated discovery artifacts

- `sitemap.xml` contains every canonical HTML route.
- `robots.txt` points to the production sitemap.
- `llms.txt` describes the product and stable machine-readable endpoints.
- `project.json` provides a compact machine-readable product description.
- `data/catalog.json` lists counts, datasets and localized routes.
- JSON-LD is limited to accurate `WebSite`, `Organization`, `SoftwareApplication`, `LearningResource`, `BreadcrumbList` and `ItemList` records.

## Deployment

GitHub Actions validates and builds, uploads `dist/`, then deploys through `actions/deploy-pages`. `.nojekyll` prevents Jekyll processing. The custom `404.html` is included at the artifact root.

## Migration boundary

MetalHatsCats keeps only two intentionally scoped MetkaX surfaces:

- the SRS compatibility API, because static hosting cannot replace it;
- the temporary transfer page, because localStorage is origin-bound.

All product pages and generation/admin routes move out or are removed. The old site supplies permanent, direct redirects from every public content URL to its closest new route.
