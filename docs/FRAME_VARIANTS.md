# Canonical Frame and Pattern Variant model

Status: public semantic model; the first three families are a bounded source-verified pilot.

## Why this layer exists

Metkagram historically published many useful contextual Pattern records. Some of those records share the same reusable syntax and communicative job while changing only the contextual material inside one or more slots.

Those records remain useful examples and stable public identifiers, but they should not automatically be treated as different learner concepts.

The compatibility model therefore separates three things:

1. **Pattern** — the stable public compatibility record and URL;
2. **Pattern Frame** — the language-specific Frame already derived from that Pattern (`frame:<pattern>:<language>`);
3. **canonical Frame** — an explicit reusable structure that may group several contextual Pattern Frames when the relation has been reviewed and published deliberately.

A **FrameVariant** relation connects one stable Pattern Frame to one canonical Frame. It does not replace the Pattern.

## Invariants

- Existing Pattern IDs, set membership, URLs and Pattern API records remain valid.
- Existing language-specific Pattern Frame IDs remain valid.
- A Pattern Frame may resolve to itself when no reviewed family exists.
- A Pattern Frame may resolve to exactly one explicit canonical Frame when a FrameVariant relation is published.
- Similar formulas in the automated quality audit do not create a canonical family automatically.
- Frame grouping is language-specific. It is not evidence of EN↔DE, EN↔FR or any other cross-language equivalence.
- Cross-language equivalence remains a separate reviewed **Bridge** relation.
- Study sets are never deleted as part of Frame grouping.

## Pilot

The first pilot covers three high-duplication families found by the corpus-wide audit:

- HED — `It would be premature to conclude that [topic] is settled.`;
- ARG — `The case for [proposal] rests on the assumption that [claim].`;
- PRO — `I am writing to clarify how [topic] affects the next steps.`.

Each family currently contains eight established Pattern records and has separate English and German canonical Frames. The source manifest is `data/frame-families.json`.

The pilot was reviewed against the canonical source records and protected by exact normalized-Frame validation. It is explicitly marked `human_reviewed: false`: this is a source-verified structural pilot, not a claim of independent human linguistic review.

## Machine-readable resolution

The public domain layer exposes:

- `/data/domain/frames.json` — stable Pattern Frames;
- `/data/domain/canonical-frames.json` — explicit canonical Frames;
- `/data/domain/frame-variants.json` — Pattern Frame → canonical Frame relations;
- `/data/domain/pattern-index.json` — compatibility resolver from every stable Pattern ID;
- `/data/domain/bridges.json` — separate reviewed cross-language relations.

Pattern API records also expose their domain resolution. Existing Pattern-based layers such as Lens, Atlas, Map, Contrasts, Choice and Routes keep their current Pattern references and can resolve them through the compatibility index.

## Editorial workflow

1. Use the corpus-wide Frame quality audit to identify candidates.
2. Review a candidate family against actual formulas, meaning, register and learning job.
3. Add the family explicitly to `data/frame-families.json` only when grouping is justified.
4. Validation checks every member, set membership and normalized Frame signature before rendering.
5. Keep uncertain cases as separate Pattern Frames until reviewed.
6. Handle standalone search indexability separately; Frame grouping itself never deletes content or changes stable URLs.

This makes the model suitable for the next indexability stage without turning SEO cleanup into destructive corpus editing.
