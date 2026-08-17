# Metkagram

Metkagram is a research-oriented English/German language-learning and language-data project built around one idea: **make structure visible inside a real sentence, then reuse that structure as a pattern**. The learning loop is sentence → inline marks → visible structure → reusable pattern → variation → recall.

The interface is available in English and Russian; English and German are independent learning-language filters. **Annotated Language / Карточки с разметкой** keeps the sentence readable while placing functional tags directly on the relevant spans. **Pattern Practice / Паттерны** turns recurring structures into reusable B2–C1 frames with examples and Russian translations. Reasoning frames extend the same model to operations such as limiting, comparing, conditioning, reframing and inferring.

The corpus is publicly inspectable through versioned datasets, a static API, a complete search index and a read-only MCP connector. Every record carries provenance and canonical links back to Metkagram. Public access supports inspection and citation; reuse is governed by the repository rights notice rather than an automatic open-data grant.

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
npm test              # content, routes, redirects, localization and API tests
npm run check:links   # verify every internal href/src in all generated pages
npm run test:e2e      # desktop and mobile critical journeys
npm run verify        # build + unit/integration tests + link checker
```

Malformed documents or pattern records fail the build. Generated output includes `.nojekyll`, root `index.html`, `404.html`, localized pages, detail pages, dataset landing pages, `sitemap.xml`, `robots.txt`, `llms.txt`, `seo/site-pages.json`, public datasets and the redirect manifest.

Pull requests and `agent/**` branches run the permanent `Verify` workflow before merge.

## Deployment

The workflow at `.github/workflows/deploy-pages.yml` builds and validates the site, uploads `dist/` as a Pages artifact, then deploys it with GitHub's official Pages action.

Repository settings must use **GitHub Actions** as the Pages source. This is an organization/user Pages repository, so assets are rooted at `/`; no repository-name base path is used.

No secrets are required by the static site.

## Rights and licensing

Metkagram is **source-available, not open source or open data by default**. The hosted learning site remains publicly usable by end users, and linking/citation are welcome. Substantial copying, redistribution, derived datasets, model-training use, modified-source distribution and commercial integration require permission unless applicable law independently permits the use.

See [LICENSE](LICENSE), [LICENSING.md](LICENSING.md), [research-use guidance](docs/RESEARCH_USE.md), and the public [Licensing & Rights](https://metkagram.github.io/en/licensing/) page.

Material distributed before 17 August 2026 under CC BY-NC 4.0 keeps the rights already granted for copies obtained under those terms. Current revisions follow the current rights notice unless explicitly marked otherwise.

Research, teaching, data/API, product and commercial licenses can be granted for a defined dataset, experiment, integration or period. Proposals are welcome through [MetalHatsCats](https://www.linkedin.com/company/metalhatscats).

## Content updates

Canonical source files are under `data/`:

- `data/metkagram-export/{enGram,deGram}/{dialogues,patterns,library}/documents.json`
- matching `data.json` collection indexes;
- `data/advanced-patterns.json` for the main B2–C1 curriculum;
- `data/reasoning-frames/*.json` for supplemental reasoning-enabled frames;
- `data/study-sets.json` for named study sets and learning paths;
- `data/pattern-annotations.json.gz` for versioned annotation-service output.

`src/content.mjs` validates identifiers, formulas, translations, set membership and language coverage. It also derives quality metadata for each public pattern. A pattern is not padded with synthetic examples just to reach a fixed count: at least two genuine variations per language are required, and unique-example/translation quality is reported separately.

Run `npm run verify` before publishing content changes. The build writes `/data/quality-report.json` as an auditable review queue.

Do not edit `dist/`; GitHub Actions regenerates it.

## Public data surfaces

Human-readable dataset directories:

- `/en/data/`
- `/ru/data/`

The directories expose dedicated `Dataset` / `DataCatalog` pages for:

- annotated English/German sentences;
- reusable B2–C1 patterns;
- reasoning frames.

Stable machine-readable exports include:

- `/data/catalog.json`
- `/data/advanced-patterns.json`
- `/data/canonical-annotations.json`
- `/data/study-sets.json`
- `/data/quality-report.json`
- `/data/reasoning-frames/index.json`
- `/api/v1/search-index.json`
- `/rights.json`

The search index covers the full annotated corpus rather than a truncated preview. Machine-readable availability does not by itself grant bulk-copy, redistribution, model-training or commercial rights; see `/rights.json` and the repository rights notice.

## Versioning and provenance

The canonical schema (`1.0.0`) stores semantic text and spans, never rendered HTML. Each canonical annotation record includes stable offsets, labels, functional roles, translations, source metadata and validation metadata. HTML is generated by the shared renderer.

Dataset versions are deterministic: package version + a fingerprint of canonical JSON data. Rebuilding identical content therefore keeps the same dataset version. API responses additionally carry per-record content hashes, canonical URLs and current rights metadata.

`SITE_RELEASE_DATE` is an explicit verified editorial release date, not the date a build happened to run.

## Annotation pipeline

`npm run build` converts legacy examples and reusable patterns into the canonical annotation dataset at `dist/data/canonical-annotations.json`, renders the static site, and writes an auditable migration report. To write the source-side migration artifacts as well, run `npm run annotations:migrate`.

After installing the optional spaCy environment, `npm run annotations:audit` parses the primary example for every English and German reusable pattern in batches and writes `reports/spacy-pattern-audit.json`.

Run `npm run annotations:prepare` to execute the spaCy annotation service over primary and variation sentences. It writes the compressed static input `data/pattern-annotations.json.gz`; the site build reads it and renders service-generated tags and roles beside annotated fragments.

## Optional local annotation service

The service is deliberately lightweight and deterministic by default. It exposes `GET /health`, `POST /v1/annotate`, and compatibility routes `GET /en/annotate/{text}` and `/de/annotate/{text}`. It returns canonical records.

```sh
python3 -m venv annotation_service/.venv
annotation_service/.venv/bin/pip install -r annotation_service/requirements-dev.txt
annotation_service/.venv/bin/python annotation_service/scripts/install_models.py
cp annotation_service/.env.example annotation_service/.env
cd annotation_service && .venv/bin/uvicorn main:app --reload --port 8080
curl -X POST http://127.0.0.1:8080/v1/annotate -H 'content-type: application/json' -d '{"text":"I will study today.","language":"en"}'
```

Run service tests with `cd annotation_service && .venv/bin/python -m pytest tests`. The optional service uses spaCy plus explicit English and German pipelines; the production static build remains model-independent.

## Decisions and limitations

- Static generation is the production path: reproducible, offline-friendly and compatible with GitHub Pages without a backend.
- The original visual-annotation idea and reusable patterns are one system, not competing product directions.
- Pattern quantity is not treated as proof of quality; quality metadata and a review queue are published explicitly.
- spaCy output is an editorial starting point rather than automatic linguistic truth; human review remains the highest-value improvement.
- Metkagram does not claim that this interface outperforms another learning method without evidence.
- Public repository visibility is not treated as a substitute for explicit licensing boundaries.

See [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [the research programme](docs/RESEARCH_PROGRAM.md), [method provenance](docs/METHOD_PROVENANCE.md), [SEO and discoverability](docs/SEO.md), [partnership brief](docs/PARTNERSHIP_BRIEF.md), and [localization strategy](docs/LOCALIZATION_STRATEGY.md).
