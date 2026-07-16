# Metkagram

Metkagram is a bilingual, static language-notation workspace. The interface is available in English and Russian; English and German are independent learning-language filters. It has two clear learning modes: **Annotated Language / Карточки с разметкой** for sentence-first inline grammar annotation, and **Pattern Practice / Паттерны** for more than 1,000 reusable B2–C1 English/German patterns. It retains the original MetkaX spaced-repetition model and progress compatibility.

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

No secrets are required by the static site. Progress synchronization calls the retained MetalHatsCats compatibility API from the browser. The API allows only the production Metkagram origin and keeps existing sync codes compatible.

## License

Metkagram materials are available under [CC BY-NC 4.0](LICENSE): free for personal, educational, research, and other non-commercial use with attribution. Commercial use requires prior written permission.

## Content updates

Canonical source files are under `data/`:

- `data/metkagram-export/{enGram,deGram}/{dialogues,patterns,library}/documents.json`
- matching `data.json` collection indexes;
- `data/advanced-patterns.json` for complete B2–C1 practice records.
- `data/study-sets.json` for named study sets and learning paths.

`src/content.mjs` validates the public curriculum at build time: at least 1,000 patterns, unique IDs and formulas, complete English/German formulas and examples with Russian translations, valid set membership, non-empty study sets, and legacy progress-safe routes.

Update source JSON, run `npm run verify`, inspect `reports/MIGRATION_VERIFICATION.md`, and commit both the source change and any updated migration documentation. Do not edit `dist/`; GitHub Actions regenerates it.

The generator produces stable public exports at `/data/collections/{en,de}/{collection}.json`, `/data/advanced-patterns.json`, and `/data/catalog.json`.

## Progress migration

The client reads and writes the legacy keys `metkax:srs:v1` and `metkax:srs:code`, while also maintaining the versioned keys `metkagram:progress:v2` and `metkagram:sync-code:v2`.

Users can migrate in either way:

1. Enter an existing synchronization code on `/en/progress/` or `/ru/progress/`; or
2. export JSON from the temporary MetalHatsCats `/ru/metkax/transfer-progress` utility and import it on the new progress page.

See [MIGRATION_MAP.md](MIGRATION_MAP.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
