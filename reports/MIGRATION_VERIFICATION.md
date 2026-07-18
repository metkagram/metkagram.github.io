# Migration verification

- Generated routes: **11559**
- API endpoints: **5992**
- Annotated documents: **2240**
- Annotated sentences: **25116**
- Advanced B2–C1 patterns: **3436**
- Redirect records: **4904**
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
