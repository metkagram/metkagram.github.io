# Pattern Lens Knowledge Bridge

Status: derived reviewed integration layer.

## Purpose

Pattern Lens already answers one question well:

> Which published Metkagram pattern is visible in this real sentence?

The knowledge bridge answers the next question without changing the matching algorithm:

> What reviewed learning object should the learner open next?

The flow becomes:

> **real text → Pattern Lens match → canonical pattern ID → reviewed relation → contrast / choice drill / Reasoning Pack → Practice**

This is intentionally a post-match layer. It does not increase Pattern Lens recall, weaken abstention, or invent relations from visual similarity.

## Derived relation index

The build creates:

- `/data/pattern-relations.json`
- `/api/v1/pattern-relations.json`

The index is derived from three reviewed public sources:

1. `data/contrasts.json`
2. `data/choice-drills.json`
3. `data/reasoning-packs.json`

There is no manually maintained fourth mapping table.

For each canonical pattern ID, the index may expose:

- reviewed contrasts that contain the pattern;
- its paired pattern ID for each contrast;
- Choice Clinic drills in which the pattern is one of the two valid options;
- whether the pattern is the best-fit or nearby option for that drill;
- Reasoning Packs that contain the pattern directly or transitively through a contrast/drill step.

## Lens behavior

After the existing Pattern Lens renderer produces a match card, the browser loads the relation index and adds up to three bounded next steps:

1. compare with a nearby reviewed pattern;
2. test the distinction in Pattern Choice Clinic;
3. follow a curated Reasoning Pack.

If the matched pattern has no reviewed downstream relation, nothing is added. The system does not manufacture a recommendation simply to fill the interface.

## Machine use

The same relation index is exposed through:

- the public API index;
- OpenAPI;
- the MCP manifest as `metkagram_get_pattern_relations`;
- the teaching manifest;
- capability discovery;
- the public data catalog;
- `llms.txt` guidance.

An AI tutor can therefore preserve the Pattern Lens canonical ID and use exactly the same reviewed next-step graph as the website.

## Integrity rules

The build fails when:

- a contrast resolves to a missing published pattern;
- a drill references a pattern outside its reviewed contrast;
- a Reasoning Pack resolves transitively to a missing pattern;
- a Lens page is missing when the bridge is injected.

Tests additionally verify that every contrast and drill is reachable from each source pattern and that pack membership resolves through pattern, contrast and drill steps.

## Why this matters

The value of Metkagram is increasingly in the relationship layer rather than isolated page count.

A canonical pattern can now be used in several coherent ways without duplication:

- discovered from real text;
- compared with a nearby pattern;
- tested through a bounded choice;
- placed inside a reasoning route;
- practised through its stable Practice page;
- retrieved by an external tutor or agent.

That makes the public project behave more like a language-pattern knowledge system and less like a catalogue of unrelated learning cards.

## Next extension

The next useful extension should remain evidence-bound. Good candidates are:

- teacher exports generated from Reasoning Packs and relation IDs;
- cross-language functional mappings where English and German structures have been explicitly reviewed as communicative matches;
- privacy-safe aggregate usage signals showing which Lens matches lead to contrast, drill, pack or Practice navigation.

Do not add inferred learner-error frequencies or automatic correctness claims without data supporting them.
