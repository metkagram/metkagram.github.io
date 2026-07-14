# Design QA — Metkagram entry, method, mobile apps and legal pages

## Comparison target

- Source visual truth: Option 1, generated design at `/Users/dzmitryikharlanau/.codex/generated_images/019f4b81-8580-7221-800f-ec279a3d4b48/exec-1c5c2a4f-2087-4599-81fa-e5d8a1ad7ceb.png`.
- Implementation: `http://127.0.0.1:4173/en/`, `/en/method/`, `/en/apps/`, `/en/legal/privacy/`, and `/en/explore/english/dialogues/iglIrNfAke7r4OZ0KxuB/`.
- Browser evidence: `reports/design-audit/2026-07-13/07-local-home-top-final.png`, `reports/design-audit/2026-07-13/06-tag-rule-open.png`, `reports/design-audit/2026-07-14/01-local-method.png`, `04-local-privacy.png`, and `05-local-apps.png`.
- Viewport: desktop layout asserted at 1440px wide by the Playwright project; the home method grid resolves to two columns and the revised home title is under 90px. Mobile is covered by the same test suite.
- State: English interface; first sentence subject tag opened by click. Keyboard focus was also tested in E2E.

## Findings

No actionable P0, P1, or P2 findings.

- Fonts and typography: the implementation preserves the existing system sans/mono pairing and compact mono labels. Home, method, and language-section headings now use a smaller editorial scale, so the reading path does not get crowded by display type.
- Spacing and layout rhythm: the hero remains a two-column editorial entry at desktop widths; the reading path, four-step method, and language rows form a clear vertical sequence. The four steps use a calm 2×2 grid on desktop and reduce to one column on mobile without clipping.
- Colors and visual tokens: existing paper, ink, dotted surface, yellow call-to-action, and tag colors are reused. There are no gradients or new decorative assets.
- Image and asset fidelity: the supplied Metkagram logo asset is retained. The selected direction needs no new raster imagery, so no placeholder imagery was introduced.
- Copy and content: the home has one language-study CTA and a secondary method link; it contains no annotated sentence. The method page now explains the sequence as attention → context → retrieval → spaced return, includes a clear non-claim boundary, and links to its research sources. The exact set page keeps the sentence as the central object and exposes a short "what it is / use it to" rule for each tag.
- Mobile apps and legal pages: the store links are direct and visible; privacy and terms pages use a stable, scannable table of contents with readable sections and a direct route back to apps, the paired policy, and contact. No visual pattern outside the existing editorial system was introduced.
- Interaction and accessibility: language switching is present in the global header. Grammar tags are native buttons, show their tooltip on hover and keyboard focus, and toggle it on touch/click. Escape closes and unfocuses the open tag.

## Evidence and interaction checks

- `npm run verify`: passed — build, 14 unit/content tests, and 5,000 internal HTML links.
- `npm run test:e2e`: passed — 17 tests across desktop and mobile, including the mobile-app/store and legal-route journey; one expected desktop-only skip remains.
- Browser check: the method page has a complete visible hierarchy from the annotated sentence through the evidence grid, limits statement, and four linked sources. No clipping or horizontal overflow was found in the tested layouts.
- Browser check: the first subject tag changed from `aria-expanded="false"` to `"true"`; its tooltip was visible and contained the English explanation and use guidance.
- Browser console: no warnings or errors.

## Comparison history

1. Initial implementation incorrectly preferred the German rule catalogue for English tags. This was a P1 copy mismatch.
2. Fixed `tagRule()` to resolve the rule catalogue from the document target language.
3. Rebuilt, reran full verification, and confirmed the first English tag shows “Subject — The main actor or receiver in the sentence.”

## Follow-up polish

- P3: review tooltip placement with real learner feedback on very long sentence rows.

## Final result

passed
