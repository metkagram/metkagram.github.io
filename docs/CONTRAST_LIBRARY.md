# Metkagram Contrast Library

Status: reviewed pilot.

## Why it exists

A large pattern catalogue is useful only when learners can tell nearby constructions apart. The Contrast Library adds an explicit comparison layer over stable Metkagram pattern IDs.

The job is not to create generic “X vs Y” SEO pages. A contrast is published only when two existing patterns are genuinely easy to confuse or perform related reasoning jobs with an important difference.

The product loop becomes:

> learner job → nearby patterns → explicit distinction → choice → canonical pattern → practice

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

Examples and formulas are not duplicated in the contrast dataset. The build resolves them from canonical pattern records so corrections propagate to every comparison that references them.

## Routes

The build publishes:

- `/en/contrasts/` and `/ru/contrasts/`;
- one localized page per reviewed contrast;
- related Pattern Choice Clinic drills on each contrast page;
- `/data/contrasts.json`;
- `/api/v1/contrasts.json`;
- a read-only MCP manifest entry;
- OpenAPI, catalog, sitemap and `llms.txt` discovery entries.

Practice and Pattern Atlas link to the Contrast Library so comparisons remain part of the learning loop rather than isolated SEO pages.

## Current reviewed graph

The current pilot contains nine deliberately reviewed comparisons across several reasoning dimensions:

1. necessary condition vs insufficient evidence;
2. missing prerequisite vs only-if rule boundary;
3. competing goals vs benefit/downside of one option;
4. suggestive evidence vs an explicit alternative explanation;
5. leading explanation vs a possibility that merely cannot be ruled out;
6. expected observation vs a condition required for a hypothesis;
7. causal chain vs multiple parallel causes;
8. corrective reframing vs relative shift of emphasis;
9. diagnostic test vs evidence threshold for revising a conclusion.

These comparisons are derived from existing curated reasoning metadata, examples and explicit contrast notes. Expansion is deliberately slower than pattern generation because a wrong relationship is more damaging than a missing relationship.

## Editorial rule

Add a contrast only when all of the following are true:

1. both source patterns are already reviewed learning objects;
2. the distinction changes meaning, reasoning function, register, scope or syntax in a way a learner can act on;
3. the explanation can be stated without inventing a universal grammar rule;
4. canonical examples make the distinction clearer;
5. the comparison can link back to stable pattern IDs;
6. the distinction supports at least one scenario where choosing the wrong frame would materially change the message.

Do not create contrasts merely because two formulas share words or because a search query exists.

## Next extensions

High-value future relation types include:

- register and politeness;
- direct vs hedged claim;
- cause vs evidence;
- direct comparison vs dimension-specific comparison;
- decision alternatives vs completed decision with rationale;
- normal vs inverted conditional;
- direct vs indirect question;
- matched English/German communicative functions.

The same relation layer can later power teacher explanations and AI-tutor retrieval without changing the canonical pattern definitions.
