# Study-set preservation policy

Status: canonical curriculum invariant for the public Metkagram project.

## Rule

**Improve and add; do not delete established study sets.**

Existing study sets are durable public learning objects. Their content may be corrected, enriched, reorganized internally, connected to canonical Frames, or receive different search/indexability treatment at the Pattern level, but an established study-set identity must not silently disappear.

This policy exists so corpus-quality, Frame/Variant and SEO work can be aggressive about improving quality without turning cleanup into curriculum loss.

## Executable contract

`data/study-set-preservation.json` freezes the established set IDs. `src/study-set-preservation.mjs` validates the contract during the build validate stage.

The contract is intentionally asymmetric:

- a new set may be added without editing the frozen historical ID list;
- removing an established ID fails validation;
- every established current set must retain canonical pattern membership, a learning-path discovery path and a canonical SEO slug;
- post-build tests verify EN/RU canonical pages, the public data export, individual API set records and sitemap inclusion.

The manifest is not a target count. Metkagram may grow beyond it.

## Editing established sets

Allowed changes include:

- correcting linguistic errors;
- improving translations and examples;
- enriching reviewed metadata;
- introducing canonical Frame ↔ Variant relations over existing Pattern records;
- adding Moves, Contrasts, Choices, Routes and Bridges;
- improving set descriptions and curated first-screen material;
- changing standalone Pattern indexability when the Pattern remains available through its stable ID, set membership and API contract;
- adding new study sets and patterns.

Do not delete a set because it is currently weak, duplicated, low-traffic or inconvenient for an SEO migration. Improve it instead.

## Exceptional migration

A real retirement or rename requires an explicit owner decision recorded in `data/study-set-preservation.json#migrations`.

An approved migration must include:

- `from` — established ID being migrated;
- `to` — current replacement ID;
- `approved: true`;
- a substantive reason;
- EN and RU compatibility routes.

The migration mechanism is deliberately inconvenient. It is for deliberate product decisions, not for bypassing a failing regression test.

## Relationship to quality and SEO work

Issues #74–#77 may audit duplicates, introduce Frame/Variant relations, change standalone Pattern indexability and upgrade high-value pages. None of those tasks authorizes deleting established study sets.

Search performance is an editorial signal, not a deletion command. Weak search performance should lead to better content, stronger internal relations, clearer intent alignment or narrower Pattern-level indexability while preserving the study set itself.
