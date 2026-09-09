# AGENTS.md — Metkagram

Use this file as the root entry point for ChatGPT and other repository agents. Preserve Metkagram's reviewed language-learning model, stable public identifiers, research/publication boundary, and existing build pipeline.

## Start here

Read only what the current task needs:

1. `README.md` — product surfaces, vocabulary, language capabilities, research/public boundary, and validation.
2. `ARCHITECTURE.md` — build stages and source/derived boundaries.
3. `docs/PRODUCT_DIRECTION.md` — product direction.
4. `docs/TERMINOLOGY.md` — canonical domain language.
5. `docs/LANGUAGE_ARCHITECTURE.md` — multilingual capability model.
6. Task-specific docs such as `docs/THINKING_IN_LANGUAGE.md` or `docs/PUBLICATION_BOUNDARY.md` only when relevant.

Do not load the entire corpus or generated site as first context.

## Task router

| Task | Canonical source | Coupled files to inspect | Verification |
| --- | --- | --- | --- |
| Product/domain semantics | `docs/PRODUCT_DIRECTION.md`, `docs/TERMINOLOGY.md` | canonical data records and affected public routes | `npm run verify` |
| Build/rendering | source and build stages documented in `ARCHITECTURE.md` | renderers, derived artifacts, release contracts | `npm run verify` |
| Patterns / Frames / Moves | canonical curriculum/source data | Atlas, Practice, Map, Contrast, Choice, Route surfaces that consume it | `npm run verify` plus targeted tests |
| Lens / annotation | reviewed annotation rules and source data | `/en/lens/`, `/ru/lens/`, annotation capability metadata | `npm run verify` and relevant regression tests |
| Languages / localization | `src/language-registry.mjs` and language-specific source data | `/data/languages.json`, glossary pages, Bridges/annotation capability claims | `npm run verify` |
| Research/evaluation | `research/`, public fixtures, evaluation protocols | research pages and release metadata | relevant test/evaluation command documented by the research surface |
| Public/private boundary or licensing | `docs/PUBLICATION_BOUNDARY.md`, `LICENSE`, `LICENSING.md` | exported/public datasets, research assets, docs | `npm run verify` |
| UI/site behavior | source components/styles/routes | metadata, internal links, sitemap/discovery surfaces | `npm run verify`; use `npm run test:e2e` when behavior warrants it |

## Source-of-truth rules

- Preserve the domain chain `Mark -> Frame -> Move -> Contrast -> Choice -> Route -> Bridge` and the compatibility role of `Pattern` unless the task explicitly changes the domain model.
- Stable IDs and URLs are compatibility contracts. Do not mass-rename them for cosmetic consistency.
- Treat interface locale, learning language, translation locale, and annotation capability as separate capabilities.
- Do not imply French annotation or reviewed French Bridges unless the canonical capability registry supports that claim.
- AI may operate around canonical learning objects; it is not the source of truth for curriculum data.
- Do not expose private research-core material through the public repository.
- When a generated artifact is wrong, change its canonical source or generator and rebuild; do not hand-edit derived output as a shortcut.

## GitHub / publication boundary

- `main` is the production GitHub Pages source. Do not push or merge to `main` unless the active user request authorizes it.
- `.github/workflows/deploy-pages.yml` deploys on `main` pushes (or manual dispatch), not ordinary feature-branch pushes or pull requests. Preserve this behavior.
- Pull requests to `main` are validated by `.github/workflows/verify.yml` with `npm ci` and `npm run verify`.
- Do not weaken verification, publication, licensing, or research-boundary checks for agent convenience.
- Passing repository checks proves the implementation contract, not language-learning efficacy or external search outcomes.

## Verification

Requirements: Node.js 24 or newer.

```bash
npm install
npm run verify
npm run test:e2e
```

Use `npm run verify` as the normal repository gate. Run `npm run test:e2e` when the change affects user-visible interaction or a route covered by end-to-end tests. Do not claim a check passed unless it ran for the changed revision.