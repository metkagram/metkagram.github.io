# Metkagram Reasoning Packs

Status: reviewed pilot.

## Purpose

Reasoning Packs turn the public relationship layer into short learning routes.

A pack does not define new grammar objects. It sequences existing canonical objects around one communication job:

> **pattern → distinction → choice → next pattern → reuse**

This creates a useful middle layer between browsing thousands of patterns and asking an AI tutor to invent a lesson from scratch.

## Public source

Source: `data/reasoning-packs.json`.

Each pack contains:

- a stable pack ID;
- English and Russian title, description and outcome;
- audience labels;
- four or more ordered steps;
- a reviewed status.

Each step stores only:

- `kind`: `pattern`, `contrast` or `drill`;
- the canonical object ID;
- an English and Russian learning instruction.

The canonical formula, distinction, scenario and explanation remain in their original datasets. Packs therefore cannot silently fork a second version of the learning object.

## Current packs

The first reviewed release contains five routes:

1. **Reason from evidence without overclaiming** — evidence vs proof, explicit alternatives, leading vs merely possible explanations.
2. **Turn a hypothesis into a test** — competing explanations, predictions, necessary implications, explanatory gaps and revision criteria.
3. **Make and explain a balanced decision** — trade-offs, option evaluation, remaining alternatives and decision rationale.
4. **Reframe without flattening the nuance** — corrective vs relative reframing, scope boundaries and hidden assumptions.
5. **Explain causes without forcing a simple story** — causal chains, multiple causes and partial causal contribution.

These are small editorial routes, not an exhaustive curriculum taxonomy.

## Build validation

The build rejects a pack when:

- its ID is duplicated or missing;
- it is not reviewed;
- localized metadata is incomplete;
- it contains fewer than four steps;
- a pattern ID does not exist in the published curriculum;
- a contrast ID does not exist in the reviewed Contrast Library;
- a drill ID does not exist in Pattern Choice Clinic;
- a step kind is unsupported.

This means a pack cannot remain apparently valid after one of its canonical dependencies disappears.

## Product surfaces

The build publishes:

- `/en/packs/` and `/ru/packs/`;
- one localized page per pack;
- `/data/reasoning-packs.json`;
- `/api/v1/reasoning-packs.json`;
- MCP and OpenAPI discovery;
- catalog, sitemap, SEO inventory and `llms.txt` entries;
- visible bridges from Practice, Contrast Library and Choice Clinic.

## Editorial rule

A new pack should be added only when:

1. the route solves a coherent learner or teacher job;
2. every referenced object already exists and is reviewed at its own layer;
3. the ordering creates a meaningful progression rather than a themed list;
4. every instruction explains why the next object matters;
5. the pack remains useful without requiring an AI runtime;
6. the route is narrow enough to complete in one focused session.

## Partnership use

Reasoning Packs are the natural unit for bounded teacher and EdTech pilots because they combine:

- stable canonical pattern IDs;
- explicit distinctions;
- retrieval decisions;
- a short sequence that can be reviewed as one lesson;
- machine-readable provenance.

An external tutor can reuse the route while still linking back to the canonical Metkagram objects instead of copying the corpus into a separate definition layer.
