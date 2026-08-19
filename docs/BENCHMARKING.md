# Benchmarking Metkagram retrieval

Metkagram publishes its intent-to-pattern routing benchmark as a reproducible editorial regression suite. It is designed to answer a narrow question: given a natural-language communicative goal, does a retrieval system identify the intended Metkagram intent/reasoning move and return at least one editorially acceptable canonical pattern near the top?

It is **not** a learning-efficacy study, a general language-model benchmark, or independent external validation. The taxonomy, cases, accepted answers and deterministic resolver are maintained by the same project.

## Public task

Each benchmark case contains:

- a natural-language query;
- locale (`en` or `ru`);
- one expected intent;
- one expected reasoning move;
- one or more editorially acceptable pattern IDs.

A system under evaluation should receive the query only and return:

1. a ranked intent prediction;
2. a reasoning-move prediction;
3. up to three canonical Metkagram pattern IDs.

## Metrics

- **Intent top-1 accuracy**: expected intent is ranked first.
- **Move top-1 accuracy**: expected reasoning move is ranked first.
- **Pattern hit@3**: at least one acceptable pattern appears in the first three pattern results.

Multiple pattern answers can be valid. The benchmark therefore uses an acceptable set rather than pretending one surface form is the only correct response.

## Reporting rules

A published run should record:

- benchmark dataset version and release date;
- system/model name and version;
- prompt or retrieval configuration;
- whether the system had access to the Metkagram taxonomy, API or pattern corpus;
- all three metrics, not only the strongest one;
- misses or abstentions;
- date of the run.

If an LLM is evaluated, freeze the prompt and model version. Do not compare runs from different benchmark revisions as if they were the same test.

## Interpretation

The bundled deterministic Metkagram resolver is a regression baseline for the project's own retrieval rules. A high score shows that current editorial routing remains consistent with the curated benchmark. It does not establish that Metkagram improves language learning, nor that the resolver generalizes to an independent population of prompts.

External benchmark extensions are most valuable when they contribute held-out prompts or independently reviewed acceptable answers rather than simply adding more cases written by the same authors.
