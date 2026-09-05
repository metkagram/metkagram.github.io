# Migration verification

- Dataset version: **1.0.0+7c4403f01051**
- Generated routes: **7451**
- API endpoints: **3963**
- Annotated documents: **72**
- Annotated sentences: **969**
- Advanced B2–C1 patterns: **3530**
- Redirect records: **2830**
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
