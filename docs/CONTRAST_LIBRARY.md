# Metkagram Contrast Library

Status: reviewed pilot.

## Why it exists

A large pattern catalogue is useful only when learners can tell nearby constructions apart. The Contrast Library adds an explicit comparison layer over stable Metkagram pattern IDs.

The job is not to create generic “X vs Y” SEO pages. A contrast is published only when two existing patterns are genuinely easy to confuse or perform related reasoning jobs with an important difference.

The product loop becomes:

> learner job → nearby patterns → explicit distinction → canonical examples → practice

## Public schema

Source: `data/contrasts.json`.

Each record contains:

- a stable contrast ID;
- exactly two canonical pattern IDs;
- English and Russian titles;
- a learner-facing choice question;
- a reviewed distinction in English and Russian;
- the relation type;
- review status.

Examples and formulas are not duplicated in the contrast dataset. The build resolves them from the canonical pattern records so corrections to a pattern propagate to every comparison that references it.

## Routes

The build publishes:

- `/en/contrasts/` and `/ru/contrasts/`;
- one localized page per reviewed contrast;
- `/data/contrasts.json`;
- `/api/v1/contrasts.json`;
- a read-only MCP manifest entry;
- OpenAPI, catalog, sitemap and `llms.txt` discovery entries.

Practice and Pattern Atlas receive a visible bridge to the Contrast Library so the pages are not orphaned.

## Pilot contrasts

The first release deliberately stays small:

1. necessary but not sufficient vs one factor alone is not enough;
2. missing prerequisite vs only-if boundary;
3. trade-off between two goals vs advantage/downside of one option.

These comparisons use already curated reasoning frames. The pilot is meant to validate the information model and user value before expanding the library.

## Editorial rule

Add a contrast only when all of the following are true:

1. both source patterns are already reviewed learning objects;
2. the distinction changes meaning, reasoning function, register, scope or syntax in a way a learner can act on;
3. the explanation can be stated without inventing a universal grammar rule;
4. canonical examples make the distinction clearer;
5. the comparison can link back to stable pattern IDs.

Do not create contrasts merely because two formulas share words or because a search query exists.

## Next extensions

High-value future relation types include:

- logical strength;
- register and politeness;
- direct vs hedged claim;
- cause vs evidence;
- normal vs inverted conditional;
- direct vs indirect question;
- matched English/German communicative functions.

The same relation layer can later power error correction, teacher explanations and AI-tutor retrieval without changing the canonical pattern definitions.
