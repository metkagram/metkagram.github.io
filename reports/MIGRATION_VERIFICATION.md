# Migration verification

- Generated routes: **6639**
- API endpoints: **3389**
- Annotated documents: **2240**
- Annotated sentences: **25116**
- Advanced B2–C1 patterns: **1036**
- Redirect records: **2504**
- Trailing-slash policy: directory URLs with trailing slash
- Progress compatibility: metkax:srs:v1 and metkax:srs:code retained; v2 export envelope added

## Automated verification

- Static build: pass
- Node content/migration/SRS/API tests: pass
- Internal link check: pass
- API schemas, OpenAPI, llms.txt, MCP spec: generated

Screenshots are stored in `reports/screenshots/`; Lighthouse JSON is stored at `reports/lighthouse-home.json`.

## External steps

- No launch blockers remain.
- Retain the MetalHatsCats SRS compatibility API, transfer utility, and permanent redirects for at least one year (preferably indefinitely).
