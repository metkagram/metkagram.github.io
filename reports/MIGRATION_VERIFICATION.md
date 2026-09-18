# Migration verification

- Dataset version: **1.0.0+c40ef7c9cc20**
- Generated routes: **2281**
- API endpoints: **1381**
- Annotated documents: **72**
- Annotated sentences: **969**
- Advanced B2–C1 patterns: **930**
- Redirect records: **1010**
- Trailing-slash policy: directory URLs with trailing slash
- Progress compatibility: The public website no longer includes review or progress synchronization features.

## Automated verification

- Static build: pass
- Node content/migration/SRS/API tests: pass
- Internal link check: pass
- API schemas, OpenAPI, llms.txt, MCP spec: generated

Screenshots are stored in `reports/screenshots/`; Lighthouse JSON is stored at `reports/lighthouse-home.json`.

## External steps

- No launch blockers remain.
- Retain permanent redirects for historical MetalHatsCats URLs.
