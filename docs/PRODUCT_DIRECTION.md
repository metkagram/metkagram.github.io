# Metkagram product direction

Status: canonical product direction for the public project.

## Product thesis

Metkagram is not trying to be a general-purpose language-learning app or a replacement for an AI writing assistant.

Its distinctive job is narrower:

> **real language → visible structure → reusable pattern → contrast → choose → practice → reuse**

The project turns language structure into inspectable learning objects. Visual annotation helps a learner notice structure inside a real sentence; reusable patterns capture what can be transferred; communicative and reasoning moves explain what the structure does; explicit contrasts show when nearby patterns are not interchangeable; choice drills force the distinction to be retrieved before feedback.

The durable asset is therefore not raw page count or pattern count. It is the reviewed relationship layer between language, function, examples, alternatives, decisions, practice and provenance.

## Core product layers

### 1. Pattern Library / Practice

The established learner-facing curriculum is a core public asset: **1,000+ reusable B2–C1 English/German patterns**, organised into study sets and learning paths. A pattern is a stable learning object with formulas, examples, translations, quality metadata and a canonical route.

The curriculum should remain broad enough to support real practice. Quantity by itself is not a quality metric, but deleting a useful existing curriculum in the name of minimalism is not a quality strategy either.

A smaller reasoning-enabled subset carries additional research metadata. It is used by the reasoning evaluation layer, Pattern Graph and reviewed comparison layers, while ordinary patterns remain fully usable in Practice.

Status: public and build-validated.

### 2. Pattern Lens

Pattern Lens is the text-to-pattern discovery entry point. A learner brings a sentence or short paragraph. Metkagram identifies high-confidence reusable structures, highlights the stable part and abstains when the available evidence does not support a reliable match.

The Lens remains precision-first. It is better to return no pattern than to attach a plausible-looking but weak explanation. The larger Practice library is a candidate space, not permission to lower retrieval precision.

Status: implemented and regression-tested.

### 3. Pattern Atlas

Pattern Atlas is the intent-to-pattern discovery layer. A learner starts from the communication or reasoning job they need to perform rather than an internal grammar label or pattern ID.

Curated topics connect real jobs such as hedging, disagreement, argumentation, advanced questions and professional communication to validated study sets and canonical patterns. Atlas pages must remain editorial rather than being generated from keyword permutations.

Status: implemented as localized topic hubs, structured discovery data and agent-facing entry points.

### 4. Pattern Graph

The Pattern Graph connects the reasoning-enabled public subset using explicit evidence already present in those records:

- reasoning move;
- study set;
- shared logic vocabulary.

The graph is intentionally conservative and reproducible. It does not claim that two patterns are pedagogically interchangeable. Ordinary Practice patterns do not need reasoning metadata merely to appear in the library.

Status: implemented as a derived dataset, API object and related-pattern navigation layer.

### 5. Contrast Library

The Contrast Library explains when two nearby patterns perform related jobs but should not be treated as equivalent.

A reviewed contrast contains exactly two canonical pattern IDs plus a learner-facing choice question and an explicit distinction. Formulas and examples remain canonical in the source pattern records rather than being copied into a second data model.

A contrast belongs in the public library only when the difference changes meaning, logical strength, framing, register, scope or syntax in a way a learner can act on. Search demand may help prioritise a comparison but does not justify inventing one.

The first pilot includes comparisons around necessary versus insufficient conditions, prerequisite framing and decision trade-offs.

Status: reviewed pilot with localized pages, data/API output and visible links from Practice and Pattern Atlas. See `CONTRAST_LIBRARY.md`.

### 6. Pattern Choice Clinic

Pattern Choice Clinic turns a reviewed distinction into an active two-option decision.

A drill presents a situation and two canonical patterns from one reviewed contrast. The learner chooses before feedback, then reveals:

- the best-fit pattern;
- why it fits the requested reasoning or discourse job;
- why the nearby pattern is not the best framing;
- a canonical link back to Practice.

The rejected option is not labelled universally wrong. The explanation is bounded to the scenario and to the already reviewed distinction. This keeps the clinic useful without pretending to be a complete grammar-correction engine.

The first pilot contains six reviewed drills, two for each current contrast.

Status: reviewed pilot with localized clinic pages, embedded contrast drills and machine-readable API/MCP output. See `CHOICE_CLINIC.md`.

### 7. Practice loop

A pattern supports a short active loop rather than passive browsing:

1. notice the structure in context;
2. inspect the reusable formula;
3. compare variations and, where useful, a reviewed nearby contrast;
4. choose between nearby patterns before feedback when the distinction matters;
5. attempt a new example before feedback;
6. self-rate retrieval;
7. revisit the same stable pattern ID later.

Where reasoning metadata exists, the learner can additionally name and compare the reasoning move. The deterministic checker does not claim to grade complete grammar, naturalness or meaning. Review state is local-first and stored only in the browser.

AI may later generate richer context, feedback and examples around this loop. AI is the tutor/interface, not the canonical curriculum.

Status: implemented with local review scheduling and a Practice-page due queue. See `PRACTICE_LOOP.md`.

### 8. Research programme

Metkagram separates product claims from research hypotheses. The first priority is to test distinctive mechanisms rather than manufacture broad efficacy claims.

The research sequence includes:

1. visual functional tags and structural-role identification;
2. pattern variations and transfer to unseen contexts;
3. retrieval-first practice and delayed access;
4. annotation agreement and data quality.

The first browser instrument, `H1-CUE-UTILITY-V1`, measures cue utility around canonical Metkagram notation. It does not establish language-learning efficacy. Negative and null findings remain useful outputs.

Status: H1 protocol, stimuli, browser experiment, export format and analysis script implemented; outcome data not yet reported.

### 9. Agent and API layer

Stable public pattern IDs, provenance and machine-readable datasets let external tutors and agents refer to the same learning objects. Agents can use the full public Practice library while reasoning-specific tools operate on the curated reasoning subset.

The public reference layer should support five bounded operations particularly well:

1. resolve a communicative intent to a small reviewed set;
2. retrieve one canonical pattern;
3. retrieve related or contrasting patterns with an explicit relation reason;
4. retrieve a reviewed choice drill when two nearby patterns are easy to confuse;
5. preserve provenance and canonical links in downstream answers.

The public API should expose the learner-facing curriculum with attribution and current rights metadata without exposing the private annotation/generation pipeline.

## Public/private boundary

The public repository is both a product and publication layer. It intentionally contains:

- the full established learner-facing Practice curriculum;
- study-set taxonomy and learning paths;
- Pattern Atlas discovery topics;
- selected annotated documents;
- selected reasoning frames and evaluation fixtures;
- reviewed pattern contrasts and bounded choice drills;
- public schemas, Pattern Lens rules, derived graph relationships, browser-side practice logic and bounded research stimuli.

The private research core retains the full annotated corpus, bulk annotation/model-preparation exports, annotation engine, spaCy pipeline, linguistic heuristics, lexical rules, generation prompts/intermediate assets, participant research files and unpublished research work.

The boundary protects reconstruction machinery and unpublished research, not the usefulness of the public learner experience.

## Non-goals

The current project does **not** prioritise:

- rebuilding the discontinued mobile application;
- competing on generic AI conversation or writing;
- generating patterns merely to inflate a count;
- generating thousands of contrast, clinic or topic pages from search keywords;
- claiming that the Choice Clinic is a complete grammar grader;
- streaks, social gamification and account systems before the core loop is useful;
- publishing the private parser, annotation engine or full research corpus;
- claiming language-learning efficacy without a suitable comparison study;
- changing H1 outcomes or exclusions after inspecting condition results.

## Product sequence

The working sequence is:

**Pattern Library/Practice → Pattern Lens → Pattern Atlas → Pattern Graph → Contrast Library → Pattern Choice Clinic → active practice loop → H1 pilot/report → agent/API integrations → teacher/research/EdTech pilots**

The library is the content substrate. Lens and Atlas provide two complementary ways into it: real text and communicative intent. Graph and Contrast Library make relationships inspectable. Choice Clinic turns a distinction into an explicit retrieval decision. Practice turns discovery and choice into reuse.

## Decision rules

A proposed feature belongs in Metkagram when it does at least one of the following:

- makes a useful language structure easier to notice;
- makes a reusable pattern easier to discover or practise;
- makes the communicative or reasoning function of a pattern clearer where such metadata is justified;
- clarifies a reviewed difference between nearby patterns;
- makes the learner retrieve that distinction before seeing feedback;
- improves transfer or retrieval practice around a stable pattern;
- improves corpus quality, provenance or evaluation;
- lets a tutor, teacher or research workflow reuse the same stable learning object.

A feature should usually be rejected or deferred when it mainly adds generic app surface area without improving one of those mechanisms.

## Near-term success signals

Measure whether the method produces useful behaviour:

- Pattern Lens precision and abstention quality;
- percentage of Lens matches that lead to opening and practising a pattern;
- Atlas topic → canonical pattern navigation;
- contrast page → Choice Clinic / canonical pattern navigation;
- Choice Clinic reveal → canonical pattern/practice navigation;
- completion of short retrieval attempts;
- return to stable pattern IDs when they become due;
- study-set coverage and editorial quality across the full Practice library;
- H1 recruitment, completion and predefined condition estimates;
- annotation agreement and regression quality;
- concrete teacher, researcher or EdTech integration interest.

Revenue experiments should follow demonstrated utility rather than substitute for it.
