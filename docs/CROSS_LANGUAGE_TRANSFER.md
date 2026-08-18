# Metkagram Cross-language Transfer

Status: derived reviewed EN↔DE functional transfer layer.

## Purpose

Metkagram already stores English and German forms inside the same canonical reusable pattern record.

Cross-language Transfer makes that relationship explicit for the reviewed reasoning-enabled subset:

> **one reasoning job → one stable pattern ID → English form ↔ German form**

The goal is not translation lookup. The learner practises carrying the same communicative or reasoning operation from one language into the other.

## Evidence boundary

A mapping is published only when:

1. the pattern has reviewed reasoning metadata;
2. the same canonical pattern record contains both an English and German form;
3. both language records contain a formula and example.

The build does **not** pair different pattern IDs because their wording looks similar.

Every record explicitly states:

- `mapping_type: same-canonical-pattern-functional-counterpart`
- `literal_equivalence: false`

This matters because functional correspondence is not the same claim as word-for-word translation interchangeability in every context.

## Public outputs

Human practice:

- `/en/transfer/`
- `/ru/transfer/`

Machine-readable map:

- `/data/cross-language-map.json`
- `/api/v1/cross-language-map.json`
- MCP tool `metkagram_get_cross_language_map`
- OpenAPI entry
- teaching manifest interface
- capability discovery
- data catalog
- `llms.txt`

Practice, Reasoning Packs and Teacher/Tutor Exports link into the transfer surface.

## Record model

Each mapping contains:

- canonical pattern ID;
- reasoning move;
- logic label where available;
- reviewed explanation of what the pattern does;
- English formula and example;
- German formula and example;
- Russian translation from the canonical English record where available;
- canonical Practice URLs;
- reviewed contrast and Reasoning Pack links already available through the Pattern Relation Index.

The relation metadata is optional. A pattern can still be a valid bilingual functional mapping even when it has no published contrast or pack.

## Learner loop

The page uses recall-first disclosure in both directions:

1. see the English formula;
2. produce the German counterpart before revealing it;
3. reverse the direction;
4. keep the reasoning job constant;
5. open the canonical pattern for examples and Practice;
6. follow a reviewed contrast or Reasoning Pack when one exists.

This is more useful than merely printing EN and DE next to each other because the learner must retrieve the counterpart before feedback.

## AI tutor use

A tutor can use the map to create a bounded cross-language task:

1. select one canonical pattern ID;
2. show one language form;
3. ask the learner to express the same reasoning job in the other language;
4. reveal the stored counterpart;
5. explain differences in surface form without changing the canonical functional mapping;
6. avoid inventing extra cross-language pairs from lexical similarity.

## Strategic value

This layer reconnects the current web-first project with one of Metkagram's original strengths: language structure should be visible and reusable across examples rather than memorised as isolated vocabulary.

It also creates a distinctive asset for bilingual learning and tutor integrations. The useful object is not simply an English sentence plus a German translation. It is a stable functional pattern with two reviewed language realizations, examples, reasoning metadata and links into the wider knowledge graph.

## Next research direction

A later research question can test whether practising transfer over stable functional pattern IDs improves retrieval or helps learners notice structural differences between English and German.

That should be treated as a hypothesis until measured. The current layer establishes the reviewed material and practice mechanism, not an efficacy claim.
