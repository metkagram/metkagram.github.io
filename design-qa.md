# Design QA — Metkagram entry page and tag rules

## Comparison target

- Source visual truth: Option 1, generated design at `/Users/dzmitryikharlanau/.codex/generated_images/019f4b81-8580-7221-800f-ec279a3d4b48/exec-1c5c2a4f-2087-4599-81fa-e5d8a1ad7ceb.png`.
- Implementation: `http://127.0.0.1:4173/en/` and `/en/explore/english/dialogues/iglIrNfAke7r4OZ0KxuB/`.
- Browser evidence: `reports/design-audit/2026-07-13/07-local-home-top-final.png` and `reports/design-audit/2026-07-13/06-tag-rule-open.png`.
- Viewport: desktop layout asserted at 1280px wide in the browser (`.menu-toggle` computed as `none`; `.home-intro` computed as two columns). Mobile was covered by the Playwright project.
- State: English interface; first sentence subject tag opened by click. Keyboard focus was also tested in E2E.

## Findings

No actionable P0, P1, or P2 findings.

- Fonts and typography: the implementation preserves the existing system sans/mono pairing, large editorial heading, and compact mono labels from the selected direction.
- Spacing and layout rhythm: the hero is now a two-column editorial entry at desktop widths; the reading path, method, and language rows form a clear vertical sequence. At mobile widths these reduce to one column without clipping.
- Colors and visual tokens: existing paper, ink, dotted surface, yellow call-to-action, and tag colors are reused. There are no gradients or new decorative assets.
- Image and asset fidelity: the supplied Metkagram logo asset is retained. The selected direction needs no new raster imagery, so no placeholder imagery was introduced.
- Copy and content: the home has one language-study CTA and a secondary method link; it contains no annotated sentence. The exact set page keeps the sentence as the central object and exposes a short "what it is / use it to" rule for each tag.
- Interaction and accessibility: language switching is present in the global header. Grammar tags are native buttons, show their tooltip on hover and keyboard focus, and toggle it on touch/click. Escape closes and unfocuses the open tag.

## Evidence and interaction checks

- `npm run verify`: passed — build, 13 unit/content tests, and 4,993 internal HTML links.
- `npm run test:e2e`: passed — 13 tests across desktop and mobile, including the new home-entry and tag-rule tests; one existing desktop-only skip remains expected.
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
