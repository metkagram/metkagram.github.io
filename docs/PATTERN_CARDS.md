# Shareable Pattern Cards

Status: deterministic publication/distribution layer generated from existing reviewed public learning objects.

## Purpose

Pattern Cards make one of Metkagram's distinctive assets portable: a reusable language Frame shown inside a complete annotated sentence.

They are intended for:

- screenshots in teaching notes and social posts;
- slides and course material;
- print/PDF workflows;
- lightweight linking back to the canonical Pattern page.

A card is not a new canonical learning object. The canonical Pattern remains the source of truth.

## Source and quality gate

Cards are generated after the Pattern indexability pass.

A Pattern is eligible only when:

1. it is approved by the current Pattern indexability policy;
2. it has both English and German learning-language records;
3. the canonical public Practice annotation export contains at least one annotation Mark on the primary example in both languages.

The generator never invents annotation spans and does not fall back to unreviewed/generated visual markup for distribution cards.

The first deterministic release selects 50 high-value eligible Patterns and produces two cards for each Pattern:

- 50 English cards;
- 50 German cards;
- 100 cards total.

Selection is deterministic and prefers existing high-value communication/reasoning study sets, reviewed Move metadata, curated records and active-practice metadata. Stable Pattern IDs remain unchanged.

## Routes

Generated output:

```text
/cards/en/<pattern-id>/
/cards/de/<pattern-id>/
/cards/manifest.json
/cards/
```

The gallery and individual card pages use `noindex,follow`. They are distribution assets, not another set of SEO landing pages. Each individual card has a canonical link to its existing learner-facing Pattern page.

The manifest records:

- stable Pattern ID;
- study-set ID;
- learning language;
- formula;
- card route;
- canonical Pattern URL;
- number of annotation spans used on the card.

## Visual contract

The current card surface is deliberately simple:

- light background;
- 16:9 screenshot/slide layout;
- responsive mobile fallback;
- print CSS sized for a 16:9 slide/page;
- formula as the visual headline;
- one complete canonical example;
- minimal inline Marks with the canonical annotation type/label;
- stable Pattern ID, canonical URL and Metkagram attribution.

Annotation styling is functional rather than decorative. Subject, verb, helper, function and pattern-part Marks can use distinct underline accents, but the sentence must remain readable without color alone.

## Screenshot and print workflow

Open a generated card route in a browser. It is already sized for a clean 16:9 capture on desktop and becomes a single-column teaching card on narrow screens.

For print/PDF, use the browser print dialog. The print stylesheet removes decorative browser-page framing and uses a 13.333 × 7.5 inch 16:9 page.

No raster image is committed as the canonical artifact. HTML remains deterministic, accessible and regenerable from source data; screenshots can be produced when needed for a specific distribution channel.

## Rights and attribution

Every card points back to the canonical Metkagram Pattern and states the current source-available boundary. Generating a screenshot or PDF does not change the rights attached to the underlying Metkagram content.

The card route is a convenience representation, not a new reuse license.

## Verification

`npm run verify` checks that:

- exactly 50 eligible Pattern IDs produce 100 EN/DE cards;
- every selected Pattern is indexable;
- every card has real canonical annotation Marks;
- every Pattern has both EN and DE variants;
- cards are `noindex,follow` and absent from the sitemap;
- canonical URL, Pattern ID and attribution are present;
- responsive/16:9 and print contracts remain in generated HTML.

A later dedicated screenshot-baseline workflow may add pixel-level visual regression. Until then, structural rendering contracts protect the deterministic layout while #35 remains open for fuller visual-regression coverage.
