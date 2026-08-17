# Metkagram B2–C1 public pattern programme

Metkagram has two complementary public learning modes.

- **Annotated Language / Карточки с разметкой** keeps functional structure visible inside complete English and German sentences.
- **Pattern Practice / Паттерны** turns selected B2–C1 reasoning and communication moves into reusable learning objects.

The public repository is intentionally a bounded publication layer. It is not the complete Metkagram curriculum.

## Public pattern contract

A published pattern is complete only when it includes:

- a stable ID;
- study-set and group metadata;
- a clear reasoning move where applicable;
- English and German formulas;
- a natural primary example in each target language;
- Russian translation support;
- at least two translated variations for each target language;
- editorial and provenance metadata used by the public quality gates.

The current public collection is sourced from `data/reasoning-frames/` and exposed through generated datasets and API routes. The full curriculum and unpublished generation assets remain in the private research core.

## Learning organisation

The public taxonomy should prioritise what a learner is trying to do with a thought, for example:

- correct or redefine a claim;
- limit an overconfident conclusion;
- express a condition or dependency;
- compare alternatives;
- qualify certainty;
- connect evidence to a conclusion;
- explain cause and consequence;
- negotiate, clarify or disagree precisely.

Traditional grammar categories remain useful metadata, but they are not the main product hierarchy.

## Pattern Graph

The production build derives a bounded Pattern Graph from explicit public metadata. Related patterns may share a reasoning move, study set or meaningful logic vocabulary.

The graph supports navigation and practice alternatives. It does not claim that connected patterns are synonyms or that the connection has demonstrated a learning effect. See `PATTERN_GRAPH.md`.

## Quality gates

The public build should fail when:

- the deliberately published reasoning showcase falls below its minimum release floor;
- pattern IDs or language formulas collide;
- required English/German examples or Russian translations are missing;
- a pattern refers to an unknown study set;
- duplicate variations reduce the usable example set below the accepted threshold;
- publication-boundary checks detect accidental restoration of private/full-curriculum paths.

**Raw pattern count is not a quality gate.** A smaller reviewed public collection is preferable to a large synthetic catalogue.

Stable IDs and canonical routes should remain unchanged once published unless a documented migration is necessary.

## Product loop

The intended progression is:

**sentence → visible structure → reusable pattern → reasoning move → nearby alternatives → retrieval attempt → later return**

AI can generate context and feedback around this loop, but the stable pattern object and its research metadata remain the canonical Metkagram layer.
