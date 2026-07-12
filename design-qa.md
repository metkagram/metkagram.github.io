# Design QA — home landing

## Comparison setup

- Source visual truth: `/Users/dzmitryikharlanau/.codex/attachments/b6ba4ccc-6d42-4841-b59a-44ed0eef0805/image-1.png`
- Implementation: `http://127.0.0.1:4173/en/`
- Implementation screenshot: `reports/design-qa/home-local-en.png`
- Viewport/state: desktop landing, default interface language English, no menu open.
- Full-view comparison: source and implementation were opened in the same visual review pass. The implementation intentionally uses the current Metkagram logo, dot-grid paper, typography, and color tokens rather than cloning unrelated imagery.
- Focused region comparison: reviewed the header, hero, interface-language control, first interactive cards, learning-language selection, and method block. Additional crops were not needed because all reviewed text and controls were legible in the desktop capture.

## Findings

No actionable P0, P1, or P2 differences remain for the agreed redesign direction.

- Fonts and typography: the high-contrast heading, mono labels, and body copy establish the same editorial hierarchy as the reference while using the project’s existing font stack. Headline wrapping is deliberate and remains readable.
- Spacing and layout rhythm: the hero uses an asymmetric two-column layout with a separate locale panel; below it, cards and study-language controls have sufficient padding and clear boundaries.
- Colors and visual tokens: off-white dotted paper, black ink, white interactive surfaces, and a focused yellow selected locale remain consistent with the existing brand system.
- Image quality and asset fidelity: the supplied Metkagram SVG logo is used directly. No image placeholders or replacement icon drawings are present.
- Copy and content: the first screen now explains the product rather than showing a grammar example; it distinguishes annotated sets, reusable patterns, interface language, and learning language.

## Interaction and accessibility checks

- The visible interface-language control has a selected state and preserves the equivalent locale path.
- The first cards link to collections and practice; the learning-language cards link to English and German collections.
- Browser console errors: none observed.
- Automated desktop/mobile journeys: 9 passed, 1 desktop-only mobile-navigation check skipped by design.

## Comparison history

1. Replaced the oversized annotated-sentence hero with an explanatory hero, an explicit interface-language picker, and a structured next-step area.
2. Captured the updated local page and verified the cards, spacing, links, and footer navigation visually.

## Follow-up polish

- [P3] Revisit exact language labels after collecting early learner feedback; no visual or usability blocker is present.

final result: passed
