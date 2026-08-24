# External surface remediation — efficacy claims

Metkagram's evidence policy (see `docs/METHODOLOGY.md`, `docs/RESEARCH_NOTES.md`):
method description ≠ design rationale ≠ research hypothesis ≠ evidence. No current
Metkagram-controlled surface may claim a quantified learning improvement unless a
published Metkagram-specific study supports that exact claim.

This file tracks surfaces that are **not editable from this repository** and the
owner actions required to bring them in line with the policy. Related: issue #68.

## Status overview

| Surface | URL | State (checked 2026-08-24) | Action |
| --- | --- | --- | --- |
| Google Play listing (legacy Android app) | https://play.google.com/store/apps/details?id=app.metkagram.android | **Live, contains an unsupported efficacy claim** | Owner must update or unpublish — see below |
| Apple App Store listing (legacy iOS app) | https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918 and https://apps.apple.com/co/app/tarjetas-gram%C3%A1tica-metkagram/id6502211918 | Both URLs return 404; the app appears removed from sale | None; re-check if it reappears |
| MetalHatsCats product page | https://metalhatscats.com/products/metkagram | No efficacy claims found | None |

## Google Play listing — owner action required

The listing cannot be edited from this repository; it requires Google Play Console
access for the MetalHatsCats developer account.

### Problematic wording (verbatim, captured 2026-08-24)

> This is not just another flashcard app — it's a **proven method that improves
> language learning effectiveness by up to 35%**.

No published Metkagram-specific study supports this claim. It must be removed or
replaced. The same listing also contains softer claims that should be qualified at
the same time:

- "Practice that sticks. … you remember faster and speak more confidently."
- "Scientific foundation. Designed with the latest linguistic insights…"
- "Audio and translations to boost memory and pronunciation."
- "…one goal: to make grammar and vocabulary easier, faster, and more practical…"

### Replacement wording (evidence-compliant)

> Metkagram is a grammar practice app built around annotated cards. Colour-coded
> tags show the role each part plays inside a real sentence, so you notice how the
> structure works instead of memorising rules in isolation. The design draws on
> established learning mechanisms — attention to form, retrieval practice and
> spaced return — which have supporting research literature. Metkagram has not yet
> established learning-outcome efficacy in its own studies; the project publishes
> its research questions and evaluation fixtures openly.

Short-description replacement (80-char store field):

> Annotated grammar cards that make sentence structure visible as you practice.

### Owner action

1. Sign in to Google Play Console (MetalHatsCats developer account).
2. Edit the store listing for `app.metkagram.android`; remove the "proven … up to
   35%" sentence and qualify the softer claims listed above, or unpublish the app.
3. Record the change date here and close the tracking issue.

Tracked in: GitHub issue #73.

## Historical context

The 35% formulation belongs to the mobile-product marketing era. It is retained
here only as a historical record of what the listing said; it is not current
project evidence and must not reappear in any current surface.
