# Migration verification

- Generated routes: **4987**
- Annotated documents: **2240**
- Annotated sentences: **25116**
- Advanced B2–C1 patterns: **236**
- Redirect records: **2504**
- Trailing-slash policy: directory URLs with trailing slash
- Progress compatibility: metkax:srs:v1 and metkax:srs:code retained; v2 export envelope added

## Automated verification (2026-07-10)

- Static build: pass
- Node content/migration/SRS tests: **12 passed**
- Internal link check: **4,988 HTML files passed**
- Playwright desktop/mobile journeys: **9 passed, 1 desktop-only skip**
- Lighthouse home: **Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100**
- MetalHatsCats lint: pass with 11 pre-existing Konturo warnings and no errors
- MetalHatsCats typecheck: pass
- MetalHatsCats production build: pass
- MetalHatsCats migration validator: **2502 old URLs mapped**

Screenshots are stored in `reports/screenshots/`; Lighthouse JSON is stored at `reports/lighthouse-home.json`.

## External steps

- Enable GitHub Pages with GitHub Actions as the source after the initial push.
- Keep the MetalHatsCats SRS compatibility API and transfer utility available during migration.
