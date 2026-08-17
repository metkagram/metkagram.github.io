# Metkagram product direction

Status: canonical product direction for the public project.

## Product thesis

Metkagram is not trying to be a general-purpose language-learning app or a replacement for an AI writing assistant.

Its distinctive job is narrower:

> **see the structure → identify the reusable move → practise it → reuse it elsewhere**

The project turns language structure into inspectable learning objects. Visual annotation helps a learner notice structure inside a real sentence; reusable patterns capture what can be transferred; reasoning moves explain what the structure does in thought and communication.

## Core product layers

### 1. Pattern Library / Practice

The established learner-facing curriculum is a core public asset: **1,000+ reusable B2–C1 English/German patterns**, organised into study sets and learning paths. A pattern is a stable learning object with formulas, examples, translations, quality metadata and a canonical route.

The curriculum should remain broad enough to support real practice. Quantity by itself is not a quality metric, but deleting a useful existing curriculum in the name of minimalism is not a quality strategy either.

A smaller reasoning-enabled subset carries additional research metadata. It is used by the reasoning evaluation layer and Pattern Graph, while ordinary patterns remain fully usable in Practice.

Status: public and build-validated.

### 2. Pattern Lens

Pattern Lens is the main discovery entry point. A learner brings a sentence or short paragraph. Metkagram identifies high-confidence reusable structures, highlights the stable part and abstains when the available evidence does not support a reliable match.

The Lens remains precision-first. It is better to return no pattern than to attach a plausible-looking but weak explanation. The larger Practice library is a candidate space, not permission to lower retrieval precision.

Status: implemented and regression-tested.

### 3. Pattern Graph

The Pattern Graph connects the reasoning-enabled public subset using explicit evidence already present in those records:

- reasoning move;
- study set;
- shared logic vocabulary.

The graph is intentionally conservative and reproducible. It does not claim that two patterns are pedagogically interchangeable. Ordinary Practice patterns do not need reasoning metadata merely to appear in the library.

Status: implemented as a derived dataset, API object and related-pattern navigation layer.

### 4. Practice loop

A pattern supports a short active loop rather than passive browsing:

1. notice the structure in context;
2. inspect the reusable formula;
3. compare variations;
4. attempt a new example before feedback;
5. self-rate retrieval;
6. revisit the same stable pattern ID later.

Where reasoning metadata exists, the learner can additionally name and compare the reasoning move. The deterministic checker does not claim to grade complete grammar, naturalness or meaning. Review state is local-first and stored only in the browser.

AI may later generate richer context, feedback and examples around this loop. AI is the tutor/interface, not the canonical curriculum.

Status: implemented with local review scheduling and a Practice-page due queue. See `PRACTICE_LOOP.md`.

### 5. Research programme

Metkagram separates product claims from research hypotheses. The first priority is to test distinctive mechanisms rather than manufacture broad efficacy claims.

The research sequence includes:

1. visual functional tags and structural-role identification;
2. pattern variations and transfer to unseen contexts;
3. retrieval-first practice and delayed access;
4. annotation agreement and data quality.

The first browser instrument, `H1-CUE-UTILITY-V1`, measures cue utility around canonical Metkagram notation. It does not establish language-learning efficacy. Negative and null findings remain useful outputs.

Status: H1 protocol, stimuli, browser experiment, export format and analysis script implemented; outcome data not yet reported.

### 6. Agent and API layer

Stable public pattern IDs, provenance and machine-readable datasets let external tutors and agents refer to the same learning objects. Agents can use the full public Practice library while reasoning-specific tools operate on the curated reasoning subset.

The public API should expose the learner-facing curriculum with attribution and current rights metadata without exposing the private annotation/generation pipeline.

## Public/private boundary

The public repository is both a product and publication layer. It intentionally contains:

- the full established learner-facing Practice curriculum;
- study-set taxonomy and learning paths;
- selected annotated documents;
- selected reasoning frames and evaluation fixtures;
- public schemas, Pattern Lens rules, derived graph relationships, browser-side practice logic and bounded research stimuli.

The private research core retains the full annotated corpus, bulk annotation/model-preparation exports, annotation engine, spaCy pipeline, linguistic heuristics, lexical rules, generation prompts/intermediate assets, participant research files and unpublished research work.

The boundary protects reconstruction machinery and unpublished research, not the usefulness of the public learner experience.

## Non-goals

The current project does **not** prioritise:

- rebuilding the discontinued mobile application;
- competing on generic AI conversation or writing;
- generating patterns merely to inflate a count;
- streaks, social gamification and account systems before the core loop is useful;
- publishing the private parser, annotation engine or full research corpus;
- claiming language-learning efficacy without a suitable comparison study;
- changing H1 outcomes or exclusions after inspecting condition results.

## Product sequence

The working sequence is:

**Pattern Library/Practice → Pattern Lens → Pattern Graph → active practice loop → H1 pilot → H1 report → H2/H3 experiments → agent/API integrations → teacher/research/EdTech pilots**

The library is the content substrate. Lens, Graph and active practice make that content easier to discover, understand and reuse.

## Decision rules

A proposed feature belongs in Metkagram when it does at least one of the following:

- makes a useful language structure easier to notice;
- makes a reusable pattern easier to discover or practise;
- makes the reasoning function of a pattern clearer where such metadata is justified;
- improves transfer or retrieval practice around a stable pattern;
- improves corpus quality, provenance or evaluation;
- lets a tutor, teacher or research workflow reuse the same stable learning object.

A feature should usually be rejected or deferred when it mainly adds generic app surface area without improving one of those mechanisms.

## Near-term success signals

Measure whether the method produces useful behaviour:

- Pattern Lens precision and abstention quality;
- percentage of Lens matches that lead to opening and practising a pattern;
- completion of short retrieval attempts;
- return to stable pattern IDs when they become due;
- study-set coverage and editorial quality across the full Practice library;
- H1 recruitment, completion and predefined condition estimates;
- annotation agreement and regression quality;
- concrete teacher, researcher or EdTech integration interest.

Revenue experiments should follow demonstrated utility rather than substitute for it.
