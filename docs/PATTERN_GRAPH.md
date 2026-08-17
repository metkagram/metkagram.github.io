# Metkagram Pattern Graph

The Pattern Graph is a derived public layer over the curated reasoning-frame showcase.

It answers a practical question:

> After I understand one reusable structure, which nearby structures should I inspect next?

## What creates a relation

Relations are derived only from explicit public metadata. Two patterns may be connected when they share one or more of:

- the same `reasoning.move`;
- the same `set_id`;
- meaningful vocabulary in the short `logic` field.

The graph does not use an embedding model, hidden LLM ranking or the private annotation engine. The same public input produces the same graph.

Each pattern keeps only a small number of highest-scoring related items. This keeps the public graph useful for navigation instead of turning every vaguely similar pattern into an edge.

## What a relation does not mean

An edge does not establish that two patterns are synonyms, pedagogically equivalent or experimentally proven to transfer between each other. It is a navigation relation over the published taxonomy.

The graph is therefore suitable for:

- showing alternatives after a learner opens one pattern;
- moving between several formulations of a reasoning move;
- giving an AI tutor bounded candidate structures;
- inspecting the shape of the published curriculum;
- generating deterministic regression fixtures.

It should not be presented as evidence of learning efficacy.

## Published outputs

The production build generates:

- `/data/pattern-graph.json` — plain public graph;
- `/api/v1/pattern-graph.json` — provenance-wrapped API record;
- related-pattern sections on public pattern pages;
- a `metkagram_get_pattern_graph` entry in the static MCP manifest.

The graph is built in `src/pattern-graph.mjs` and finalized by `scripts/finalize-product-direction.mjs`.

## Node shape

Each node includes:

- stable pattern ID;
- study set and group;
- reasoning move;
- short logic description;
- English and German formulas;
- canonical URL;
- a bounded `related` list with score and relation evidence.

## Quality principle

The graph follows the same precision-first policy as Pattern Lens: explicit, inspectable relations are preferred over broad semantic guesses. Adding more edges is not itself an improvement.
