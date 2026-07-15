# Metkagram

Metkagram is a bilingual, static language-notation workspace. The interface is available in English and Russian; English and German are independent learning-language filters. It combines 2,240 annotated Metkagram documents with 284 B2–C1 patterns and the original MetkaX spaced-repetition model.

Production: [https://metkagram.github.io](https://metkagram.github.io)

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. The local server reads only the generated `dist/` directory, matching GitHub Pages behavior.

## Build and validation

```bash
npm run build         # validate content and generate deterministic static HTML
npm test              # content, routes, redirects, localization and SRS tests
npm run check:links   # verify every internal href/src in all generated pages
npm run test:e2e      # desktop and mobile critical journeys
npm run verify        # build + unit/integration tests + link checker
```

Malformed documents or pattern records fail the build. Generated output includes `.nojekyll`, root `index.html`, `404.html`, localized pages, detail pages, `sitemap.xml`, `robots.txt`, `llms.txt`, public datasets and the redirect manifest.

## Deployment

The workflow at `.github/workflows/deploy-pages.yml` builds and validates the site, uploads `dist/` as a Pages artifact, then deploys it with GitHub's official Pages action.

Repository settings must use **GitHub Actions** as the Pages source. This is an organization/user Pages repository, so assets are rooted at `/`; no repository-name base path is used.

No secrets or server APIs are required by the static site. Progress is local-first; users can move it between devices with JSON export and import.

## License

Metkagram materials are available under [CC BY-NC 4.0](LICENSE): free for personal, educational, research, and other non-commercial use with attribution. Commercial use requires prior written permission.

## Content updates

Canonical source files are under `data/`:

- `data/metkagram-export/{enGram,deGram}/{dialogues,patterns,library}/documents.json`
- matching `data.json` collection indexes;
- `data/advanced-patterns.json` for B2–C1 practice.

Update source JSON, run `npm run verify`, inspect `reports/MIGRATION_VERIFICATION.md`, and commit both the source change and any updated migration documentation. Do not edit `dist/`; GitHub Actions regenerates it.

The generator produces stable public exports at `/data/collections/{en,de}/{collection}.json`, `/data/advanced-patterns.json`, and `/data/catalog.json`.

## Progress migration

The client reads the legacy `metkax:srs:v1` key and maintains the versioned `metkagram:progress:v2` key.

Users can export a JSON backup on one device and import it on `/en/progress/` or `/ru/progress/` on another device.

See [MIGRATION_MAP.md](MIGRATION_MAP.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
