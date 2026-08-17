# Metkagram Pattern Lens

## Product thesis

Metkagram should not compete with large language models on general English or German writing. Modern models already generate fluent language well. The project is more useful when it helps a human **see a reusable structure inside real language, learn it, and use it again**.

The core loop is:

> real sentence → visual structure → reusable pattern → deliberate practice

This connects the original Metkagram annotation idea with the current pattern library without rebuilding the discontinued mobile application.

## Two durable assets

### Pattern Library

The library is the curated learning layer. A pattern should be more than a sentence template. Each published learning object should have:

- a stable Metkagram ID;
- communicative function or reasoning move when available;
- English and German formulae;
- strong canonical examples and variations;
- translations;
- links to related patterns and study sets;
- provenance and a canonical URL.

Quality and selection matter more than raw pattern count.

### Pattern Lens

Pattern Lens is the discovery layer. A learner pastes a sentence or short paragraph from real work, reading, subtitles, or an AI answer. The public preview matches it against the bounded public pattern collection and highlights stable parts of likely constructions.

The public preview is intentionally conservative. It does **not** publish the complete parser or annotation engine.

## Private research boundary

The following remain in the private research core unless explicitly licensed or published later:

- the full spaCy annotation pipeline;
- lexical and linguistic rule tables;
- bulk/full annotation corpus;
- unpublished pattern curriculum;
- higher-recall pattern extraction and ranking;
- teacher or partner batch-processing services.

The public website demonstrates the method with selected data and deterministic pattern matching. It must not pretend that the bounded public matcher is the full annotation engine.

## AI agents

AI is a tutor and interface, not the source of the Metkagram curriculum.

Recommended agent loop:

1. Receive a learner's real text or communicative goal.
2. Search Metkagram for one to three useful patterns.
3. Explain why the pattern is useful in that context.
4. Ask the learner to produce a new example.
5. Check the attempt without changing the canonical pattern definition.
6. Return the same pattern later for retrieval practice.

The machine-readable teaching contract is published at `/api/v1/teaching-manifest.json`.

The existing `/api/v1/mcp-server.json` is a static adapter/tool manifest. It is **not** a hosted remote MCP transport endpoint. A real remote MCP service can be added later without changing the learning model.

## Monetization paths

Do not restart with a broad consumer mobile subscription. Validate narrower value first.

1. **Curated premium collections** — small, high-quality sets such as Professional English, B2 Core Structures, C1 Reasoning, Meetings & Disagreement, or German B2.
2. **Teacher / tutor studio** — paste text, extract teachable structures, select patterns, create a lesson, and export.
3. **Licensed annotation service** — partners submit text and receive Metkagram spans, pattern IDs, and learning metadata from the private engine.
4. **Research / institutional licensing** — scoped access to larger corpora, annotation outputs, evaluation or collaboration.

The website remains the public proof, discovery surface and citation layer.

## Success signals

Prefer behaviour that shows learning or downstream use over vanity traffic:

- Pattern Lens analyses completed;
- pattern-page opens from Lens results;
- repeated visits to the same pattern or set;
- external links to canonical pattern pages;
- agent/API requests that resolve to a pattern;
- teacher or partner requests for larger annotation access;
- demand concentrated around identifiable pattern collections.

## Near-term roadmap

1. Improve deterministic matching and visual annotation using public data.
2. Add a small hand-reviewed benchmark: text → expected useful pattern(s).
3. Expand curated patterns only where benchmark coverage or real demand shows a gap.
4. Prototype private high-recall analysis with the spaCy engine behind a non-public interface.
5. Test one paid collection or teacher workflow before investing in accounts, billing or another mobile client.
