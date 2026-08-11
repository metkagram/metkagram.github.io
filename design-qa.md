# Design QA — Pattern reader refresh

## Comparison target

- Source visual truth: selected Product Design direction 2 at `/Users/dzmitryikharlanau/.codex/generated_images/019fe2b2-307c-7e82-bbe5-a70a16f44551/exec-f8aaad07-87ad-4747-a1bf-d556505ea48a.png`.
- Implementation: `http://127.0.0.1:4173/en/practice/c1arg001/`.
- Implementation evidence: `/Users/dzmitryikharlanau/Developments/metkagram.github.io/.tmp/design-audit/03-pattern-reader-final.png` (full view) and `/Users/dzmitryikharlanau/Developments/metkagram.github.io/.tmp/design-audit/04-pattern-examples.png` (focused examples).
- Viewport: source is 2048 × 1152; implementation capture is 1419 × 777 CSS px at device scale factor 1. The shared desktop state and content were compared; the source is wider, so headline wrapping is intentionally three lines in the narrower implementation instead of two.
- State: English C1ARG001 pattern page; no tooltip is open; formula, primary bilingual example, and numbered variations are visible across the captures.

## Findings

No actionable P0, P1, or P2 findings remain.

- Fonts and typography: the heading is reduced to a reading-oriented 61px at the captured desktop width, with a 1.08 line height. Formula labels stay compact mono, while bilingual sentence text is 21.12px with relaxed 1.68 line height. The narrower browser viewport explains the additional headline wrap versus the selected 2048px design.
- Spacing and layout rhythm: breadcrumb, metadata, headline, formula, primary example, and variations now live in one centered reader surface. Formula rows use an aligned label column; variation rows use a simple numbered gutter and dividers rather than a stack of cards.
- Colors and visual tokens: the dotted texture is removed for pattern pages and replaced with a pale slate surround plus a quiet white reader surface. The existing semantic annotation colors remain intact: subject `rgb(255, 196, 0)`, verb `rgb(223, 112, 87)`, and object `rgb(93, 159, 154)` were checked in the browser. Their reduced surface tints preserve the original meaning while lowering visual noise.
- Image and asset fidelity: the selected direction contains no new imagery beyond the existing Metkagram logo, which is retained as the project asset. No replacement or generated visual asset was required.
- Copy and content: all existing formula, annotation, language, and variation content is preserved. No annotation rules or data were changed.
- Interaction and accessibility: the site retains its existing semantic tag buttons, keyboard focus treatment, locale controls, sharing actions, and print action. Browser inspection found no horizontal overflow in the reader at the tested desktop width.

## Comparison history

1. Initial implementation placed the reader surface below a separate breadcrumb strip. This was a P2 hierarchy mismatch with the selected reader layout.
2. Moved the existing breadcrumb into the reader surface and adjusted the surface spacing; recaptured `/Users/dzmitryikharlanau/Developments/metkagram.github.io/.tmp/design-audit/03-pattern-reader-final.png`.
3. Rechecked the full reader and focused annotated-example region. The final layout has the intended single focused surface, quiet slate page surround, clear formula rows, and readable continuous examples.

## Focused region comparison

- Formula region: the implementation matches the selected design's paired label-and-formula rows, with a modest neutral border and no saturated panel.
- Annotated example region: the implementation uses the source data's actual English/German sentence content and all supported semantic tags, so it is denser than the mock while maintaining its reading-first hierarchy and color semantics.

## Verification

- `npm run build`: passed; 11,559 routes generated.
- `npm test`: passed; 41 tests.
- Browser: `pattern-reader-body` is active, the dotted background is absent, no horizontal overflow was detected, 77 annotation tags render, and sharing controls remain available.

## Follow-up polish

- P3: validate the mobile reader with learners once a device-width browser capture is available; the responsive formula and variation rules are in place but were not visually captured in this desktop browser session.

## Final result

passed
