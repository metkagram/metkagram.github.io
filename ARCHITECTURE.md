# Architecture

## Decision

Metkagram uses a small Node.js static generator instead of a client-only SPA or server framework. The public learning content does not require a framework runtime. Direct generation preserves crawlable HTML, makes Pages paths deterministic, keeps the agent-facing data reproducible, and avoids shipping unnecessary client code for thousands of content pages.

The product model is intentionally simple: **sentence → visible structure → reusable pattern → variation → recall**. Annotated sentences and reusable patterns are two views of the same language system, not separate products.

## Layers

1. **Canonical content** — source JSON in `data/` holds English/German annotated documents, reusable patterns, study sets and supplemental reasoning frames. Interface translations are separate in `src/i18n.mjs`.
2. **Validation and quality** — `src/content.mjs` checks required identifiers, titles, annotations, language records, translations, uniqueness and index/document parity. It also derives per-pattern quality metadata. Invalid records fail the build; low variation is reported rather than hidden behind synthetic padding.
3. **Static rendering** — `src/render.mjs` owns the legacy shared layout and primary page templates. Dataset landing pages live in `src/data-pages.mjs`. `scripts/build.mjs` writes directory-style URLs to `dist/`.
4. **Discovery and agent surfaces** — `src/api.mjs` builds the static API, `src/search-index.mjs` builds a complete compact index over all annotated documents, and `src/quality.mjs` publishes the editorial review queue.
5. **Progressive enhancement** — `public/assets/app.js` adds filters, mobile navigation and client interactions. Core content, structured data and links remain useful without JavaScript.
6. **Optional annotation service** — `annotation_service/` is an editorial NLP tool. Production rendering stays model-independent; service output is versioned static input rather than a runtime dependency.
7. **Compatibility backend** — GitHub Pages hosts no server functions. The retained `https://metalhatscats.com/api/metkax/srs` endpoint exists only for historical compatibility.

## Data quality boundary

Metkagram does not treat record count as editorial quality.

- Every pattern must contain English and German formulas, examples and Russian translations.
- At least two genuine variations per language are required for structural completeness.
- Quality metadata records unique-example counts, duplicate counts and translation completeness.
- `quality.indexable` is a content signal, not a marketing claim.
- Synthetic examples created only to satisfy a fixed count are prohibited.
- `/data/quality-report.json` is the machine-readable review queue.

The source corpus remains canonical. Quality fields are derived during loading so the policy can improve without rewriting historical source files merely to attach computed metrics.

## Reproducibility and provenance

Every API record carries canonical source metadata and a content hash. Dataset versions use the package version plus a deterministic fingerprint of canonical JSON data. Rebuilding identical content therefore produces the same dataset version.

`SITE_RELEASE_DATE` represents the verified editorial release date for substantial site changes. It is not generated from the wall clock at build time.

## URL policy

- Canonical origin: `https://metkagram.github.io`.
- Directory URLs always include a trailing slash.
- `/` is a crawlable language gateway, not a forced redirect.
- Interface locale is the first segment: `/en/` or `/ru/`.
- Learning language is the next relevant segment: `/explore/english/` or `/explore/german/`.
- Advanced pattern IDs are canonicalized to lowercase in public URLs.
- Human-readable data hubs live under `/{locale}/data/` while raw canonical exports stay under `/data/` and `/api/v1/`.

The locale switcher changes only the first segment, preserving the target language, collection and detail ID where equivalent localized routes exist.

## Generated discovery artifacts

- `sitemap.xml` contains canonical HTML routes with verified modification dates.
- `robots.txt` points to the production sitemap and exposes read-only agent entry points.
- `llms.txt` describes the product and stable machine-readable endpoints.
- `project.json` provides a compact machine-readable product description and dataset version.
- `data/catalog.json` lists counts, datasets, localized landing pages and quality resources.
- `data/quality-report.json` exposes content-quality signals and the review queue.
- `data/reasoning-frames/index.json` exposes reasoning-enabled patterns as a coherent public subset.
- `/en/data/` and `/ru/data/` publish `DataCatalog` and `Dataset` pages for humans and search engines.
- JSON-LD uses accurate `WebSite`, `Organization`, `SoftwareApplication`, `LearningResource`, `Dataset`, `DataCatalog`, `BreadcrumbList`, `ItemList` and research entities where relevant.

## Verification and deployment

The permanent `Verify` workflow runs on pull requests and `agent/**` branches:

1. `npm ci`
2. `npm run verify`

The main deployment workflow repeats validation, builds `dist/`, uploads the Pages artifact, then deploys through `actions/deploy-pages`. `.nojekyll` prevents Jekyll processing. The custom `404.html` is included at the artifact root.

## Migration boundary

MetalHatsCats keeps only intentionally scoped historical compatibility surfaces. Product pages, datasets, annotations and reusable-pattern discovery belong to `metkagram.github.io`. Permanent redirects should point historical public URLs directly to their closest canonical Metkagram route rather than to generic landing pages.
