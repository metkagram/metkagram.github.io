# Metkagram Pattern Choice Clinic

Status: reviewed pilot.

## Purpose

The Contrast Library explains a difference. Pattern Choice Clinic turns that distinction into a small retrieval decision.

The learner loop is:

> **situation → choose A/B → reveal explanation → open canonical pattern → reuse**

The important part is that the choice happens before feedback. The clinic is therefore not another page of explanations and not a general grammar checker.

## Public source

The reviewed drill source is `data/choice-drills.json`.

Each drill contains:

- a stable drill ID;
- one reviewed Contrast Library ID;
- exactly two canonical pattern IDs;
- one expected best-fit pattern;
- an English and Russian situation prompt;
- an explanation of why the expected pattern fits;
- an explanation of why the nearby pattern is not the best framing;
- explicit review status.

A drill is rejected by the build if its options do not match the referenced contrast, if the answer is outside those options, or if a referenced pattern does not exist in the published curriculum.

## Pilot scope

The first release contains six drills, two for each reviewed contrast:

1. necessary but not sufficient vs one factor alone is not enough;
2. missing prerequisite vs only-if rule boundary;
3. competing goals vs benefit/downside of one option.

The situations are deliberately close to existing reviewed reasoning-frame semantics. They are not presented as empirical claims about the most common learner mistakes.

## Product surfaces

The build publishes:

- `/en/clinic/` and `/ru/clinic/`;
- drill sections directly on the related contrast pages;
- `/data/choice-drills.json`;
- `/api/v1/choice-drills.json`;
- a read-only MCP tool entry;
- OpenAPI, catalog, sitemap, SEO inventory, `llms.txt` and capability-discovery entries.

Practice and Contrast Library link into the clinic so it forms part of the learning loop rather than an orphaned exercise page.

## Editorial rule

Add a drill only when all of the following are true:

1. the referenced contrast is reviewed;
2. both candidate patterns are canonical public learning objects;
3. the situation clearly activates the distinction already documented by the contrast;
4. the expected choice does not depend on hidden context;
5. the explanation states the limit of the rejected option instead of calling it universally wrong;
6. the drill can be solved from meaning or discourse function, not from superficial keyword matching.

## What this is not

Pattern Choice Clinic does not claim to:

- grade arbitrary learner writing;
- detect all grammatical errors;
- estimate how common a mistake is;
- prove learning efficacy;
- replace a teacher or a general AI tutor.

Its narrower role is to make reviewed distinctions retrievable through deliberate choice.

## Next extensions

High-value extensions are:

- more reviewed contrast pairs with two-sided drills;
- register and politeness choices;
- direct vs hedged claims;
- cause vs evidence framing;
- English/German matched-function choices;
- optional local progress over stable drill IDs;
- AI-tutor retrieval where a detected ambiguity returns the relevant contrast and drill rather than an invented explanation.
