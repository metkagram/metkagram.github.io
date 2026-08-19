# Metkagram product direction

Status: canonical product direction for the public project.

## Product thesis

Metkagram is not a general-purpose language-learning app and it is not an AI writing assistant. Its distinctive job is narrower:

> **real language → visible structure → reusable frame → communicative move → contrast → choice → route → bridge → reuse**

Metkagram turns language structure into inspectable learning objects. A learner reads a complete sentence first. Small visual **Marks** make useful structure easier to notice. Reusable **Frames** capture language-specific form. A **Move** explains what the speaker is doing. **Contrasts** distinguish nearby choices. **Choices** require retrieval before feedback. **Routes** sequence reviewed objects around one coherent job. **Bridges** connect reviewed realizations of the same or a closely related Move across languages.

The durable asset is not page count. It is the reviewed relationship layer between real language, reusable form, function, examples, alternatives, decisions, learning sequences, cross-language realizations and provenance.

The canonical vocabulary is defined in `TERMINOLOGY.md`.

## Canonical vocabulary

The core chain is:

**Mark → Frame → Move → Contrast → Choice → Route → Bridge**

`Pattern` remains the familiar learner-facing umbrella term and the compatibility term used by existing stable IDs, URLs and datasets. New conceptual work should use the more precise object names where the distinction matters.

Learner-facing product surfaces use one consistent family of names:

- **Pattern Practice** — browse and practise the public curriculum;
- **Pattern Lens** — real text → relevant patterns;
- **Pattern Atlas** — communicative job → relevant patterns;
- **Pattern Map** — inspect reviewed relationships;
- **Pattern Contrasts** — compare nearby patterns;
- **Pattern Choice** — choose before feedback;
- **Pattern Routes** — follow a short curated sequence;
- **Pattern Bridge** — retrieve and compare reviewed cross-language realizations.

Legacy technical names such as `Pattern Graph`, `Choice Clinic`, `Reasoning Packs` and `Cross-language Transfer` may remain temporarily in filenames, IDs, tests and compatibility URLs. They are not the vocabulary for new learner-facing copy.

## Core product layers

### 1. Pattern Practice

The established learner-facing curriculum remains the public substrate: 1,000+ reusable B2–C1 English/German patterns organised into study sets and learning paths, plus a bounded French Frame-only pilot.

A learner-facing Pattern packages a language-specific Frame with examples, translations, variations, quality metadata and a canonical route. Existing stable pattern IDs remain valid.

The curriculum should stay broad enough for real practice. Quantity is not a quality metric, but deleting useful content merely to make the product look minimal is not quality either.

The additive **Thinking in Language** layer currently contributes 40 reviewed Frames across eight sets: problem framing, reasoning under uncertainty, systems thinking, decision quality, causal diagnosis, hypothesis testing, perspective taking and metacognitive learning. These Frames must remain natural language worth practising, not translated reasoning jargon.

Status: public and build-validated.

### 2. Pattern Lens

Pattern Lens is the text-to-pattern entry point. A learner brings a sentence or short paragraph. Metkagram identifies high-confidence reusable structures, highlights stable form and abstains when evidence is weak.

Lens is precision-first. The larger library is a candidate space, not permission to attach plausible-looking explanations to every sentence.

A confirmed match can continue from the stable pattern ID into reviewed Contrasts, Choices, Routes and Bridges. If no reviewed relation exists, Lens stops instead of inventing one.

Status: implemented and regression-tested.

### 3. Pattern Atlas

Pattern Atlas starts from the job the learner needs to perform rather than from an internal grammar label.

Curated topics connect real jobs such as hedging, disagreement, argumentation, professional communication, causal diagnosis, hypothesis testing, perspective taking and metacognitive learning to validated study sets, Moves and canonical patterns. Atlas pages remain editorial rather than keyword-generated landing-page sludge, a genre the web already possesses in heroic quantities.

Atlas extensions are additive and can live in separate validated topic files so curriculum growth does not require one ever-expanding monolithic discovery document.

Status: implemented as localized topic hubs and structured discovery data.

### 4. Pattern Map

Pattern Map makes reviewed relationships inspectable. The underlying implementation may remain graph-shaped, but the learner-facing concept is a map of useful connections rather than a promise of mathematical graph expertise.

Relations may use reviewed evidence such as Move, study set, logic vocabulary, Contrast or Bridge. A relation must state why it exists. Similarity alone does not imply pedagogical interchangeability.

Status: implemented over the reasoning-enabled subset.

### 5. Pattern Contrasts

A Contrast explains when two nearby Frames perform related jobs but should not be treated as equivalent.

A reviewed Contrast contains two canonical pattern references plus an explicit distinction. It belongs in the public layer only when the difference changes meaning, logical strength, framing, register, scope or syntax in a way the learner can act on.

Status: reviewed pilot with localized pages and machine-readable data.

### 6. Pattern Choice

Pattern Choice turns a reviewed Contrast into an active decision.

A Choice presents a situation and two nearby canonical patterns. The learner chooses before feedback, then sees the best-fit answer, why it fits, why the alternative is not the best framing for this situation, and a canonical link back to Practice.

The rejected option is not labelled universally wrong. Feedback stays bounded to the reviewed scenario and distinction.

Status: reviewed pilot. Existing `/clinic/` compatibility URLs may remain until a deliberate URL migration is justified.

### 7. Pattern Routes

A Route is a short curated sequence over canonical patterns, Contrasts and Choices.

A Route stores ordered object references plus editorial guidance. It does not copy canonical formulas or explanations into a second source of truth. Fixing a canonical object therefore improves every Route that points to it.

A Route must solve one coherent job, contain enough validated steps to form a useful session and remain useful without an AI runtime.

Status: reviewed pilot. Existing pack IDs and filenames remain compatibility details.

### 8. Pattern Bridge

A Bridge is a reviewed cross-language relation between language-specific Frames that perform the same or a closely related Move.

A Bridge is not a translation. Translation answers “what does this example mean for this learner?” A Bridge answers “how is this communicative Move naturally realised in another language?”

The current EN↔DE implementation can continue to use same-pattern reviewed forms as a safe compatibility source. The long-term data model makes Bridge relations explicit so additional languages are not forced into artificial one-to-one symmetry.

The French pilot deliberately has Frames before reviewed French Bridges. A shared Pattern ID must not be interpreted as proof of EN↔FR or DE↔FR equivalence.

Status: reviewed EN↔DE retrieval layer plus a French Frame-only pilot with Bridge review still gated.

### 9. Teacher and tutor exports

Portable exports expose reviewed Routes and their referenced objects without creating another curriculum.

Exports preserve order, stable IDs, canonical URLs, attribution and rights metadata. Public exportability does not make the underlying material unrestricted open data.

Status: implemented for current reviewed routes.

### 10. Practice loop

A useful session follows a small active loop:

1. read the complete sentence;
2. notice a useful Mark when annotation exists;
3. inspect the reusable Frame;
4. understand the Move;
5. compare a reviewed Contrast when the distinction matters;
6. make a Choice before feedback;
7. follow a Route when the job needs several related objects;
8. use a Bridge when cross-language retrieval is useful;
9. produce a new example;
10. revisit the stable pattern later.

Annotation is helpful but optional. A target language can participate in Frames and Moves before it has its own annotation profile. Contrasts, Routes and especially Bridges still require their own review rather than being inferred from the existence of a Frame.

AI may generate richer context, tutoring and examples around this loop. AI is an interface and tutor, not the canonical curriculum.

## Multilingual direction

Metkagram separates three language axes:

1. **interface locale** — navigation and explanations;
2. **learning language** — the language whose Frames are being studied;
3. **translation locale** — the language used for learner support and translations.

Annotation is a fourth optional capability rather than a requirement for every learning language.

The current public combination is:

- interface: English, Russian;
- established learning: English, German;
- learning pilot: French with Frame-only content;
- translations in canonical pattern data: Russian;
- annotation: English, German;
- French annotation: unavailable in the current pilot;
- reviewed French Bridges: not claimed by the current pilot.

Future languages must be added through the capability registry rather than by extending `if (english) ... else if (german)` branches. See `LANGUAGE_ARCHITECTURE.md`.

This lets a language become useful incrementally. The French pilot now demonstrates the first step in practice: Frames, examples and Russian learner-support translations can exist while annotation, Bridges and a localized interface remain separate review gates.

## Research programme

Metkagram separates product claims from research hypotheses. The research programme focuses on distinctive mechanisms:

1. visual Marks and structural-role identification;
2. Frame variation and transfer to unseen contexts;
3. retrieval-first Choice and delayed access;
4. cross-language retrieval through reviewed Bridges;
5. annotation agreement and content quality;
6. intent-to-pattern retrieval and calibrated abstention.

The public 54-case reasoning-routing benchmark remains a bounded editorial regression surface. Curriculum growth, including new Thinking in Language Moves, does not silently rewrite that frozen evidence fixture.

Research pages must distinguish evidence about general learning mechanisms from evidence about Metkagram itself. Null results remain useful results.

## Agent and API layer

Stable IDs, provenance and machine-readable datasets allow external tutors and agents to refer to the same learning objects.

The public reference layer should support bounded operations particularly well:

1. resolve a communicative job to a small set of Moves/Patterns;
2. retrieve one canonical Pattern/Frame;
3. retrieve reviewed relations with an explicit reason;
4. retrieve a Contrast and related Choice;
5. retrieve an ordered Route;
6. retrieve reviewed cross-language Bridge information;
7. expose available language capabilities rather than making clients infer them;
8. preserve provenance, attribution and canonical links downstream.

The public API exposes learner-facing content and relations without exposing the private annotation/generation pipeline.

## Public/private boundary

The public repository intentionally contains the useful publication layer: curriculum, study-set taxonomy, selected annotations, Pattern Atlas topics, reviewed reasoning metadata, Contrasts, Choices, Routes, Bridges, derived relation data, exports, schemas, evaluation fixtures and public research materials.

The private research core may retain the full annotated corpus, bulk model-preparation exports, annotation engine, spaCy pipeline, linguistic heuristics, lexical rules, generation prompts/intermediate assets, participant files and unpublished research work.

The boundary protects reconstruction machinery and unpublished research, not the usefulness of the public learner experience.

Public inspectability is not an unrestricted reuse grant. Current reuse follows `LICENSE`, `LICENSING.md` and the machine-readable rights metadata; historical grants for earlier revisions remain historical grants.

## Decision rules

A feature belongs in Metkagram when it materially improves at least one of these things:

- noticing useful structure in real language;
- discovering or practising a reusable Frame;
- understanding the Move behind a Frame;
- distinguishing nearby Frames through a reviewed Contrast;
- retrieving a distinction through a Choice;
- sequencing reviewed objects through a Route;
- connecting language-specific Frames through a reviewed Bridge;
- supporting another interface, learning or translation language without duplicating architecture;
- improving corpus quality, provenance or evaluation;
- letting teachers, researchers or agents reuse the same stable objects.

A feature should be deferred when it mainly adds generic app surface area, new terminology or page volume without strengthening one of those mechanisms.

## Product sequence

The working sequence is:

**Pattern Practice → Pattern Lens + Pattern Atlas → Pattern Map → Pattern Contrasts → Pattern Choice → Pattern Routes → Pattern Bridge → active practice → research/evaluation → agent and teacher integrations → additional reviewed language capabilities**

The sequence is a dependency map, not a requirement that every learner visit every screen.
