# Metkagram product direction

Status: canonical product direction for the public project.

## Product thesis

Metkagram is not trying to be a general-purpose language-learning app or a replacement for an AI writing assistant.

Its distinctive job is narrower:

> **real language → visible structure → reusable pattern → contrast → choose → route → transfer → practice → reuse**

The project turns language structure into inspectable learning objects. Visual annotation helps a learner notice structure inside a real sentence; reusable patterns capture what can be transferred; communicative and reasoning moves explain what the structure does; explicit contrasts show when nearby patterns are not interchangeable; choice drills force the distinction to be retrieved before feedback; curated packs sequence stable objects into short routes; cross-language transfer keeps the reasoning job stable while moving between English and German.

The durable asset is therefore not raw page count or pattern count. It is the reviewed relationship layer between language, function, examples, alternatives, decisions, learning routes, cross-language realizations, practice and provenance.

## Core product layers

### 1. Pattern Library / Practice

The established learner-facing curriculum is a core public asset: **1,000+ reusable B2–C1 English/German patterns**, organised into study sets and learning paths. A pattern is a stable learning object with formulas, examples, translations, quality metadata and a canonical route.

The curriculum should remain broad enough to support real practice. Quantity by itself is not a quality metric, but deleting a useful existing curriculum in the name of minimalism is not a quality strategy either.

A smaller reasoning-enabled subset carries additional research metadata. It is used by the reasoning evaluation layer, Pattern Graph and reviewed comparison/transfer layers, while ordinary patterns remain fully usable in Practice.

Status: public and build-validated.

### 2. Pattern Lens

Pattern Lens is the text-to-pattern discovery entry point. A learner brings a sentence or short paragraph. Metkagram identifies high-confidence reusable structures, highlights the stable part and abstains when the available evidence does not support a reliable match.

The Lens remains precision-first. It is better to return no pattern than to attach a plausible-looking but weak explanation. The larger Practice library is a candidate space, not permission to lower retrieval precision.

After a confirmed match, a derived Pattern Relation Index can continue from the stable pattern ID into reviewed contrasts, Pattern Choice Clinic drills and Reasoning Packs. This post-match bridge does not change the matching score or abstention behavior. If no reviewed downstream relation exists, Lens simply stops at the canonical pattern instead of inventing a recommendation.

Status: implemented, regression-tested and connected to the reviewed knowledge graph. See `LENS_KNOWLEDGE_BRIDGE.md`.

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

The current reviewed graph contains **9 contrast pairs** spanning logical strength, prerequisite framing, decision framing, evidence interpretation, epistemic strength, hypothesis testing, causal structure, reframing strength and revision criteria.

Status: reviewed pilot with localized pages, data/API output and visible links from Practice and Pattern Atlas. See `CONTRAST_LIBRARY.md`.

### 6. Pattern Choice Clinic

Pattern Choice Clinic turns a reviewed distinction into an active two-option decision.

A drill presents a situation and two canonical patterns from one reviewed contrast. The learner chooses before feedback, then reveals:

- the best-fit pattern;
- why it fits the requested reasoning or discourse job;
- why the nearby pattern is not the best framing;
- a canonical link back to Practice.

The rejected option is not labelled universally wrong. The explanation is bounded to the scenario and to the already reviewed distinction. This keeps the clinic useful without pretending to be a complete grammar-correction engine.

The current pilot contains **18 reviewed drills across 9 contrasts**, with exactly two drills per contrast and both source patterns serving once as the best-fit answer. This two-sided rule prevents one pattern from silently becoming the default choice.

Status: reviewed pilot with localized clinic pages, embedded contrast drills and machine-readable API/MCP output. See `CHOICE_CLINIC.md`.

### 7. Reasoning Packs

Reasoning Packs are short curated routes over canonical patterns, contrasts and choice drills.

A pack does not duplicate formulas, explanations or answers. It stores only the ordered object IDs plus an editorial instruction explaining why each next step matters. This makes packs compositional: fixing a canonical pattern or contrast automatically updates every route that points to it.

The first release contains five reviewed routes:

- reason from evidence without overclaiming;
- turn a hypothesis into a test;
- make and explain a balanced decision;
- reframe without flattening nuance;
- explain causes without forcing a simple story.

A route must solve one coherent job, contain at least four validated steps and remain useful without an AI runtime. This makes packs suitable for learner sessions, teacher pilots and agent-guided lessons while keeping the canonical knowledge layer separate from presentation.

Status: reviewed pilot with localized pack pages and machine-readable API/MCP output. See `REASONING_PACKS.md`.

### 8. Cross-language Transfer

Cross-language Transfer makes the bilingual structure of reviewed reasoning patterns usable as retrieval practice.

A public transfer mapping is created only when the **same canonical pattern ID** already contains reviewed English and German forms. The mapping therefore means “same Metkagram reasoning job inside one reviewed object”, not “word-for-word interchangeable translation in every context”.

The learner can start from the English formula and retrieve the German counterpart before reveal, then reverse the direction while keeping the reasoning function stable.

The build must not create a cross-language mapping between different pattern IDs merely because their words or embeddings look similar.

Status: derived reviewed EN↔DE functional map with localized recall-first practice, API/MCP output and links back into canonical Practice. See `CROSS_LANGUAGE_TRANSFER.md`.

### 9. Teacher & Tutor Exports

Teacher/Tutor Exports make reviewed Reasoning Packs portable without creating a second curriculum.

Every reviewed pack is generated into:

- a provenance-rich JSON bundle for tutors, agents and integrations;
- a CSV for spreadsheet/editorial workflows;
- a study-friendly TSV for flashcard/import workflows.

Exports preserve step order, stable IDs, canonical URLs, attribution and current rights metadata. They contain only already public learning objects and do not expose the private annotation/generation pipeline.

Exportability does not make the underlying material open data or open source. The current source-available terms remain attached to the public material.

Status: implemented for all current reviewed Reasoning Packs with localized export catalog pages and API/MCP discovery. See `TEACHER_TUTOR_EXPORTS.md`.

### 10. Practice loop

A pattern supports a short active loop rather than passive browsing:

1. notice the structure in context;
2. inspect the reusable formula;
3. compare variations and, where useful, a reviewed nearby contrast;
4. choose between nearby patterns before feedback when the distinction matters;
5. follow a short curated pack when the job requires several related moves;
6. transfer the same reviewed reasoning job between English and German where a canonical bilingual mapping exists;
7. attempt a new example before feedback;
8. self-rate retrieval;
9. revisit the same stable pattern ID later.

Where reasoning metadata exists, the learner can additionally name and compare the reasoning move. The deterministic checker does not claim to grade complete grammar, naturalness or meaning. Review state is local-first and stored only in the browser.

AI may generate richer context, feedback and examples around this loop. AI is the tutor/interface, not the canonical curriculum.

Status: implemented with local review scheduling and a Practice-page due queue. See `PRACTICE_LOOP.md`.

### 11. Research programme

Metkagram separates product claims from research hypotheses. The first priority is to test distinctive mechanisms rather than manufacture broad efficacy claims.

The research sequence includes:

1. visual functional tags and structural-role identification;
2. pattern variations and transfer to unseen contexts;
3. retrieval-first practice and delayed access;
4. cross-language retrieval over stable functional patterns;
5. annotation agreement and data quality.

The first browser instrument, `H1-CUE-UTILITY-V1`, measures cue utility around canonical Metkagram notation. It does not establish language-learning efficacy. Negative and null findings remain useful outputs.

Cross-language Transfer supplies reviewed stimuli and a practice mechanism for a future transfer hypothesis; it is not itself evidence that bilingual retrieval improves outcomes.

Status: H1 protocol, stimuli, browser experiment, export format and analysis script implemented; outcome data not yet reported.

### 12. Agent and API layer

Stable public pattern IDs, provenance and machine-readable datasets let external tutors and agents refer to the same learning objects. Agents can use the full public Practice library while reasoning-specific tools operate on the curated reasoning subset.

The public reference layer should support these bounded operations particularly well:

1. resolve a communicative intent to a small reviewed set;
2. retrieve one canonical pattern;
3. retrieve related or contrasting patterns with an explicit relation reason;
4. retrieve a reviewed choice drill when two nearby patterns are easy to confuse;
5. retrieve a curated reasoning route when the learner needs several linked moves;
6. continue from a Lens pattern ID through the derived relation index;
7. retrieve reviewed EN↔DE forms inside the same canonical pattern ID;
8. retrieve a portable reviewed pack for a teacher/tutor workflow;
9. preserve provenance, attribution and canonical links in downstream answers.

The public API should expose the learner-facing curriculum with attribution and current rights metadata without exposing the private annotation/generation pipeline.

## Public/private boundary

The public repository is both a product and publication layer. It intentionally contains:

- the full established learner-facing Practice curriculum;
- study-set taxonomy and learning paths;
- Pattern Atlas discovery topics;
- selected annotated documents;
- selected reasoning frames and evaluation fixtures;
- reviewed pattern contrasts, bounded choice drills and curated reasoning packs;
- the derived Pattern Relation Index;
- reviewed same-pattern EN↔DE functional mappings for the reasoning-enabled subset;
- generated teacher/tutor exports over already public reviewed objects;
- public schemas, Pattern Lens rules, derived graph relationships, browser-side practice logic and bounded research stimuli.

The private research core retains the full annotated corpus, bulk annotation/model-preparation exports, annotation engine, spaCy pipeline, linguistic heuristics, lexical rules, generation prompts/intermediate assets, participant research files and unpublished research work.

The boundary protects reconstruction machinery and unpublished research, not the usefulness of the public learner experience.

## Non-goals

The current project does **not** prioritise:

- rebuilding the discontinued mobile application;
- competing on generic AI conversation or writing;
- generating patterns merely to inflate a count;
- generating thousands of contrast, clinic, pack, transfer or topic pages from search keywords;
- claiming that the Choice Clinic is a complete grammar grader;
- letting AI invent canonical curriculum relationships at runtime;
- creating EN↔DE mappings between different pattern IDs from lexical or embedding similarity without review;
- treating portable exports as permission for unrestricted substantial reuse;
- streaks, social gamification and account systems before the core loop is useful;
- publishing the private parser, annotation engine or full research corpus;
- claiming language-learning efficacy without a suitable comparison study;
- changing H1 outcomes or exclusions after inspecting condition results.

## Product sequence

The working sequence is:

**Pattern Library/Practice → Pattern Lens + relation bridge → Pattern Atlas → Pattern Graph → Contrast Library → Pattern Choice Clinic → Reasoning Packs → Cross-language Transfer → Teacher/Tutor Exports → active practice loop → research pilots/reports → agent/API integrations → teacher/research/EdTech pilots**

The library is the content substrate. Lens and Atlas provide complementary ways into it: real text and communicative intent. Graph and Contrast Library make relationships inspectable. Choice Clinic turns a distinction into an explicit retrieval decision. Packs compose canonical objects into a focused route. Transfer reuses the same stable pattern across EN and DE. Exports let external workflows reuse the reviewed route without forking definitions. Practice turns discovery, choice, sequencing and transfer into repeated retrieval.

## Decision rules

A proposed feature belongs in Metkagram when it does at least one of the following:

- makes a useful language structure easier to notice;
- makes a reusable pattern easier to discover or practise;
- makes the communicative or reasoning function of a pattern clearer where such metadata is justified;
- clarifies a reviewed difference between nearby patterns;
- makes the learner retrieve that distinction before seeing feedback;
- sequences reviewed objects into a coherent learning job without duplicating them;
- transfers one reviewed function between language forms already stored in the same canonical object;
- lets a teacher/tutor reuse reviewed objects without creating another source of truth;
- improves transfer or retrieval practice around a stable pattern;
- improves corpus quality, provenance or evaluation;
- lets a tutor, teacher or research workflow reuse the same stable learning object.

A feature should usually be rejected or deferred when it mainly adds generic app surface area without improving one of those mechanisms.

## Near-term success signals

Measure whether the method produces useful behaviour:

- Pattern Lens precision and abstention quality;
- Lens match → canonical pattern / contrast / drill / pack navigation;
- Atlas topic → canonical pattern navigation;
- contrast page → Choice Clinic / canonical pattern navigation;
- Choice Clinic reveal → canonical pattern/practice navigation;
- pack start → ordered-step completion / canonical pattern navigation;
- Cross-language Transfer reveal → canonical pattern/practice navigation;
- teacher/tutor export downloads and concrete workflow feedback;
- two-sided contrast coverage and editorial quality;
- completion of short retrieval attempts;
- return to stable pattern IDs when they become due;
- study-set coverage and editorial quality across the full Practice library;
- H1 recruitment, completion and predefined condition estimates;
- annotation agreement and regression quality;
- concrete teacher, researcher or EdTech integration interest.

Revenue experiments should follow demonstrated utility rather than substitute for it.
