# Metkagram terminology

Status: canonical vocabulary for learner-facing copy, product documentation and new data models.

Metkagram should use a small vocabulary that explains the learning model instead of inventing a separate brand name for every page. **Pattern** remains the familiar public umbrella term. The more precise Metkagram objects below describe what a pattern is doing inside the system.

## The core chain

> **Mark → Frame → Move → Contrast → Choice → Route → Bridge**

### Mark

A **Mark** is a small visual cue placed directly inside a real sentence. It makes one structural or functional role easier to notice without replacing the sentence with a grammar diagram.

Marks are the closest term to the original Metkagram idea: put useful marks into language so structure stays visible while meaning remains intact.

Examples: subject, verb, object or another reviewed functional cue.

### Frame

A **Frame** is a reusable language structure in one specific language.

Examples:

- English: `It's not that [X]; it's that [Y].`
- German: `Es ist nicht so, dass [X]; vielmehr [Y].`

These can serve a similar communicative job, but they are two language-specific Frames rather than one string with two translations.

For compatibility, existing public records and URLs may still call these objects patterns. New conceptual work should distinguish the umbrella term **Pattern** from the precise object **Frame**.

### Move

A **Move** is the communicative or reasoning job a speaker performs.

Examples: correct a framing, hedge a claim, introduce a prerequisite, challenge an assumption, draw a cautious conclusion.

A Move is language-independent. Several Frames in one language may express the same Move, and another language may realise it differently.

### Contrast

A **Contrast** is a reviewed distinction between two nearby Frames. It explains why they are related but not interchangeable in a particular dimension such as logical strength, register, syntax, scope or stance.

A Contrast is an editorial relation, not a similarity score.

### Choice

A **Choice** is a short retrieval task built from a reviewed Contrast. The learner sees a situation, chooses between nearby Frames, then reveals bounded feedback.

Use **Pattern Choice** for the learner-facing product surface. Do not use “Clinic”. The learner is making a language decision, not attending a medical facility, despite software's recurring urge to name ordinary screens as if they require a specialist appointment.

### Route

A **Route** is an ordered learning sequence through Frames, Contrasts and Choices that solves one coherent communicative or reasoning job.

Use **Pattern Routes** for the learner-facing surface. Do not use “Reasoning Packs” as the primary name. A route tells the learner what the object does; a pack mostly tells them that several things were put in a bag.

### Bridge

A **Bridge** is a reviewed cross-language relation between Frames that perform the same or a closely related Move.

A Bridge is not automatically a translation and it is not created merely because two strings look similar. It may record an exact functional counterpart, a near counterpart, a constrained mapping or the absence of a useful one-to-one equivalent.

Use **Pattern Bridge** for cross-language retrieval and comparison.

## Supporting terms

### Pattern

**Pattern** remains the public umbrella term because it is familiar, searchable and already present throughout the curriculum and URLs. A Pattern can be understood as the learner-facing package around a Frame: formula, examples, translations, variations and metadata.

Do not rename stable public pattern IDs merely to make internal terminology look pure. Stable identifiers are more valuable than aesthetic tidiness.

### Example

An **Example** is a complete sentence showing a Frame in context. It belongs to one language.

### Translation

A **Translation** is learner support in a chosen support language. It helps the learner understand a Frame or Example. It is not a Bridge.

This distinction matters: translation answers “what does this mean here?” while a Bridge answers “how is this Move naturally realised in another language?”

### Set

A **Set** is an editorial grouping of learning objects. It is organizational, not semantic.

## Product surface names

Use these names consistently in public copy:

| Canonical name | Job | Replaces / clarifies |
|---|---|---|
| **Pattern Practice** | browse and practise canonical patterns | existing name |
| **Pattern Lens** | real text → relevant patterns | existing name |
| **Pattern Atlas** | communicative job → relevant patterns | existing name |
| **Pattern Map** | inspect reviewed relations | Pattern Graph in learner-facing copy |
| **Pattern Contrasts** | compare nearby patterns | Contrast Library |
| **Pattern Choice** | choose before feedback | Pattern Choice Clinic / Choice Clinic |
| **Pattern Routes** | follow a short curated sequence | Reasoning Packs |
| **Pattern Bridge** | retrieve or compare across languages | Cross-language Transfer |

`graph`, `clinic`, `pack` and `transfer` may remain in legacy filenames, implementation details, dataset IDs or redirects while compatibility requires them. They should not drive new learner-facing language.

## Naming rules

1. Prefer one concrete noun for one concept.
2. Do not create a branded term when an existing canonical term already describes the object.
3. Keep learner-facing names understandable without project documentation.
4. Keep technical IDs stable unless a migration has a measurable benefit.
5. A new term must fit the core chain or clearly describe a product surface.
6. Translation and cross-language equivalence are different relations and must never be silently merged.
7. Annotation is optional per learning language; a Frame can exist without Marks.

## One-sentence explanation

**Metkagram puts Marks inside real language, turns recurring structures into Frames, explains the Move behind them, and helps learners practise through Contrasts, Choices, Routes and Bridges.**
