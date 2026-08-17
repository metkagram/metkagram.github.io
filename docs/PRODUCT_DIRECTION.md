# Metkagram product direction

Status: canonical product direction for the public project.

## Product thesis

Metkagram is not trying to be a general-purpose language-learning app or a replacement for an AI writing assistant.

Its distinctive job is narrower:

> **see the structure → identify the reusable reasoning move → practise it → reuse it elsewhere**

The project turns language structure into inspectable learning objects. Visual annotation helps a learner notice structure inside a real sentence; reusable patterns capture what can be transferred; reasoning moves explain what the structure does in thought and communication.

## Core product layers

### 1. Pattern Lens

Pattern Lens is the main entry point. A learner brings a sentence or short paragraph. Metkagram identifies only high-confidence public structures, highlights the reusable part and abstains when the bounded public collection does not support a reliable match.

The Lens must remain precision-first. It is better to return no pattern than to attach a plausible-looking but weak explanation.

Status: implemented and regression-tested in the public web product.

### 2. Pattern Graph

The Pattern Graph connects published patterns by explicit evidence already present in the corpus:

- reasoning move;
- study set;
- shared logic vocabulary.

The graph is intentionally bounded and reproducible. It does not claim that two patterns are pedagogically interchangeable. Its job is to help a learner move from one useful structure to nearby alternatives for the same or a related reasoning task.

Status: implemented as a derived public dataset, API object and related-pattern navigation layer.

### 3. Practice loop

A pattern supports a short loop rather than passive browsing:

1. notice the structure in context;
2. name the reasoning move;
3. inspect the reusable formula;
4. compare a small number of variations;
5. attempt a new example before feedback;
6. self-rate retrieval;
7. revisit the same stable pattern ID later.

The current public implementation checks only whether stable parts of the published frame are visible in the learner's attempt. It does not claim to grade complete grammar, naturalness or meaning. Review state is local-first and stored only in the browser.

AI may later generate richer context, feedback and new examples around this loop. AI is the tutor/interface, not the canonical curriculum.

Status: implemented with local review scheduling and a Practice-page due queue. See `PRACTICE_LOOP.md`.

### 4. Research programme

Metkagram separates product claims from research hypotheses. The first priority is to test the distinctive mechanism, not to manufacture broad efficacy claims.

The initial research sequence is:

1. visual functional tags and structural-role identification;
2. pattern variations and transfer to unseen contexts;
3. retrieval-first practice and delayed access;
4. annotation agreement and data quality.

Negative and null findings are useful outputs and should be retained.

The next major product milestone is a small preregistered pilot. Product usage, local review completion and positive user reactions are useful behavioural signals but are not evidence of learning efficacy.

### 5. Agent and API layer

Stable pattern IDs, provenance and bounded machine-readable datasets let external tutors and agents refer to the same learning objects without copying the private research core.

The public API should expose enough information to inspect, cite and use the public showcase while preserving the publication boundary defined in `PUBLICATION_BOUNDARY.md`.

## Public/private boundary

The public repository is a publication and evaluation layer. It may contain selected annotated documents, selected reasoning frames, evaluation fixtures, public schemas, Pattern Lens rules, derived graph relationships and browser-side practice logic around the published sample.

The full curriculum, private corpus, annotation engine, linguistic heuristics, bulk exports and unpublished research assets remain outside the public repository.

Public size is not a success metric. A smaller reviewed collection is preferable to a large synthetic catalogue.

## Non-goals

The current project does **not** prioritise:

- rebuilding the discontinued mobile application;
- competing on generic AI conversation or writing;
- maximising the raw number of patterns;
- streaks, social gamification and account systems before the core loop is useful;
- publishing the private parser or full research corpus;
- claiming language-learning efficacy without a direct comparison study.

## Product sequence

The working sequence is:

**Pattern Lens → Pattern Graph → active practice loop → first pilot study → agent/API integrations → teacher/research/EdTech pilots**

The first three layers are now implemented. Work should move toward validating the mechanism and improving the same learning loop rather than opening another parallel product track.

## Decision rules

A proposed feature belongs in Metkagram when it does at least one of the following:

- makes a useful language structure easier to notice;
- makes the reasoning function of a pattern clearer;
- improves transfer or retrieval practice around a stable pattern;
- improves corpus quality, provenance or evaluation;
- lets a tutor, teacher or research workflow reuse the same stable learning object.

A feature should usually be rejected or deferred when it mainly adds generic app surface area without improving one of those mechanisms.

## Near-term success signals

Before optimising for revenue or scale, measure whether the method produces useful behaviour:

- Pattern Lens precision and abstention quality;
- percentage of Lens matches that lead to opening and practising a pattern;
- completion of one short retrieval attempt after viewing a pattern;
- return to a stable pattern ID when it becomes due;
- proportion of attempts marked `Needs work` versus `Got it` over repeated reviews;
- annotation agreement and regression quality;
- ability to recruit and complete a small preregistered pilot;
- concrete teacher, researcher or EdTech integration interest.

Revenue experiments should follow demonstrated utility rather than substitute for it.
