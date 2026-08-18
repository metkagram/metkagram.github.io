# Metkagram Teacher & Tutor Exports

Status: generated public reuse layer over reviewed Reasoning Packs.

## Purpose

Reasoning Packs are useful inside the Metkagram website, but teachers, tutors and external learning tools often need portable material.

The export layer turns each reviewed Reasoning Pack into three generated formats without creating a second curriculum:

- JSON bundle for tutors, agents and integrations;
- CSV for spreadsheets and editorial review;
- study-friendly TSV for flashcard/import workflows.

The source of truth remains the canonical public objects:

> **Reasoning Pack → stable pattern / contrast / drill IDs → generated export**

No pattern formula, contrast explanation or drill answer is manually maintained in an export file.

## Public routes

Human-facing pages:

- `/en/exports/`
- `/ru/exports/`

Generated files:

- `/exports/reasoning-packs/<pack-id>.json`
- `/exports/reasoning-packs/<pack-id>.csv`
- `/exports/reasoning-packs/<pack-id>.anki.tsv`
- `/exports/reasoning-packs/index.json`

Machine discovery:

- `/data/teacher-exports.json`
- `/api/v1/teacher-exports.json`
- MCP tool manifest entry `metkagram_get_teacher_exports`
- OpenAPI entry
- teaching manifest interface
- capability discovery
- data catalog
- `llms.txt`

## What a bundle contains

Every bundle preserves:

- the Reasoning Pack ID and titles;
- pack description, outcome and audience;
- original step order;
- step kind and stable object ID;
- English and Russian instructions;
- canonical object URL;
- English and German formulas where applicable;
- canonical examples where applicable;
- teacher/study front and back fields;
- Metkagram attribution and current rights metadata.

A contrast card uses the reviewed choice question as the front and the reviewed distinction as the back.

A drill card uses the reviewed scenario and two canonical candidate formulas as the front, and the reviewed best-fit answer plus explanation as the back.

A pattern card uses the pack instruction as the prompt and the canonical formula/example as the answer material.

## Rights boundary

Exportability does not make the project open data or open source.

Every JSON bundle carries the same current attribution and source-available rights metadata used by the public API. CSV/TSV records preserve canonical URLs and Metkagram tags so downstream users can keep provenance attached.

The exports contain only already published learning objects. They do not include:

- the private full annotated corpus;
- the spaCy annotation engine;
- lexical rules or private heuristics;
- generation prompts/intermediate assets;
- participant research files;
- unpublished annotation/model-preparation exports.

## Teacher workflow

A compact workflow is:

1. choose a reviewed Reasoning Pack;
2. inspect the canonical web route;
3. download JSON, CSV or TSV;
4. adapt examples, pacing or delivery to the learner;
5. keep stable IDs and canonical links;
6. return editorial corrections to the canonical objects rather than maintaining a forked copy.

This last point matters. The export is a delivery format, not a new source of truth.

## AI tutor workflow

An external tutor can:

1. retrieve the export index;
2. choose a pack based on the learner's reasoning/communication job;
3. preserve the pack step order;
4. generate context around each canonical object;
5. use the reviewed contrast/drill answers instead of inventing a distinction;
6. cite the canonical Metkagram URL when surfacing the object.

## Commercial relevance

This is also a practical partnership surface because a teacher, language school or EdTech partner can now test Metkagram in a real workflow before requesting a deeper integration.

A pilot can be scoped around one reviewed pack and concrete feedback:

- which steps were useful;
- where explanations were unclear;
- which export format fit the workflow;
- what additional metadata the partner actually needed.

That evidence is more useful than adding speculative enterprise features before anyone has tried to reuse the material.
