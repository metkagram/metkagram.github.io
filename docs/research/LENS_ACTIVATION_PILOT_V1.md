# Lens Activation Pilot v1

Status: **pre-registered product-research protocol; no participant results yet**  
Related issue: #97  
Core loop under test: **real sentence → reviewed Frame/Move → own sentence → structural check → reviewed next step**

## Purpose

This pilot asks a product question, not a learning-efficacy question:

> Does an independent B2–C1 learner understand the Metkagram Lens workflow, get a result they consider useful often enough, reuse the Frame in their own sentence, and show any pull to use the workflow again?

The pilot must not be reported as evidence that Metkagram improves language proficiency, retention, fluency or learning speed.

## Participants

Minimum first-session sample: **10 independent learners** outside the implementation loop.

Preferred profile:

- B2–C1 English or German learner;
- can already understand reasonably complex real language;
- feels active expression is simpler or less precise than comprehension;
- has not been coached on Metkagram taxonomy before the session.

Record only a participant code in the private research notes. Do not commit participant identity, learner text, recordings, raw event exports or contact details to the public repository.

## Consent and privacy script

Before the session, explain:

1. Metkagram stores a bounded activity log only in that browser.
2. Pattern Lens input text is not stored in the activity log.
3. Nothing is uploaded automatically.
4. The participant may inspect, export or clear the local log.
5. Sharing the aggregate activation summary is optional and requires an explicit export action.
6. The aggregate summary contains no learner text, event IDs, session IDs, object IDs or Pattern IDs.

If the participant does not want to share an export, continue the usability session without it.

## First-session procedure

Do not explain Frames, Moves, Contrast, Choice or Route before the participant starts.

### Task A — start from real language

Ask the participant to bring or find one sentence they genuinely encountered in an email, article, conversation, work message or AI answer.

Prompt only:

> Use this page to see whether there is something in the sentence worth learning and reusing.

Observe whether the participant can identify the Lens input and start without intervention.

### Task B — make it theirs

If Lens returns a reviewed result, do not tell the participant what to type next. Observe whether the primary result and **Now make it yours** step are understandable.

Record whether the participant:

- reads/understands the selected Frame;
- writes a new sentence;
- uses the structural check;
- reacts to the check as expected or becomes confused.

### Task C — continue or stop naturally

After the check, do not direct the participant to a specific downstream object. Observe whether they open a Contrast, Choice, Route, canonical Pattern page or simply stop.

Stopping is a valid observation.

### Task D — repeat with another genuine need

Ask for one additional sentence or communicative need from the participant's own life. Do not supply a prepared showcase sentence unless the participant cannot provide one.

No-match outcomes remain in the dataset. Do not replace them with a demo query.

## Observer fields

For each participant record privately:

- participant code;
- target language and approximate self-reported level;
- `started_without_explanation`: yes/no;
- number of genuine Lens analyses attempted;
- for each analysis: reviewed match / calibrated no-match;
- `participant_called_any_match_useful`: yes/no/unclear;
- `own_example_attempted`: yes/no;
- `structural_check_completed`: yes/no;
- `continued_to_reviewed_next_step`: yes/no;
- major confusion point, if any;
- what the participant expected to happen next;
- whether an aggregate activation summary was voluntarily exported/shared.

Do not copy the participant's original or newly written sentences into the public research record.

## Post-session questions

Ask these questions in this order without suggesting positive answers:

1. What, if anything, was useful here?
2. What was unclear or unnecessary?
3. Was the result connected to what you wanted to understand or say?
4. What did you expect to happen after the result?
5. In what real situation, if any, would you use this again?
6. What would stop you from using it again?

Optional final rating after the open questions: **Would you use this workflow again with your own language? yes / maybe / no.**

## Follow-up / repeat-pull check

Invite a subset of at least **5** participants to use the same public Lens again several days later if they encounter language they want to understand or reuse.

Do not send a prepared sentence with the reminder. The signal of interest is whether they return with a new genuine need.

A second local browser session is only a technical proxy. Count **voluntary repeat pull** only when the participant actually reports or demonstrates a new independent use.

## Product signals

Keep these distinct:

- **entry clarity** — starts without explanation;
- **retrieval coverage** — reviewed match vs calibrated no-match;
- **learner-perceived usefulness** — participant says the match helped their real need;
- **reuse activation** — attempts own sentence;
- **completion** — performs structural check;
- **continuation** — opens a reviewed next-step object;
- **repeat pull** — independent later use with a new genuine need.

Engineering retrieval benchmarks are not learner-perceived usefulness. Local activity events are not proof of voluntary repeat pull.

## Aggregate activation export

The Local activity page may export a separate aggregate Lens activation summary. Use it only as a cross-check against observer notes.

Expected aggregate fields include analyses, matched/no-match analyses, own-example attempts, completed checks, Lens-origin continuations and separate local Lens sessions.

Never publish a participant's raw detailed event export.

## Pre-declared product-decision heuristics

These are **small-sample product heuristics**, not statistical or efficacy thresholds.

### Continue core-product investment

Prefer this decision when, among the first 10 participants:

- at least 8 start without explanation;
- at least 6 attempt their own sentence;
- at least 5 complete the structural check;
- at least 5 explicitly say at least one result addressed a real need; and
- at least 2 of the follow-up group independently return with a new genuine need.

### Narrow the product

Use this when overall pull is mixed but one audience, language or learner job clearly produces repeated usefulness/activation while other jobs consistently fail.

Do not delete the wider corpus; narrow the primary product entry and positioning around the working job.

### Repair the core loop

Use this when participants understand the value proposition but repeatedly fail because of a specific fixable blocker such as match coverage, result explanation, structure-check feedback or next-step hierarchy.

Run a second version of this same pilot after the repair; do not redefine the original results.

### Research/reference direction

Use this when participants value the corpus, examples or explanations but rarely attempt their own sentence or return to Lens as a workflow.

In that case Metkagram may be stronger as a research/reference/AI curriculum resource than as a standalone learner product.

### Stop major product expansion

Treat this as the default if fewer than 3 of the first 10 participants attempt their own sentence despite a usable, functioning flow, or if participants consistently cannot identify a real situation in which they would return.

This does not require deleting the corpus or stopping the research project. It means do not keep expanding the standalone product surface without new evidence.

## Reporting rule

After the first-session sample and follow-up window, create one dated decision record containing:

- participant count;
- aggregate activation counts;
- usefulness/confusion themes;
- no-match observations;
- repeat-pull observations;
- known limitations;
- one decision: **continue / narrow / repair / research-reference / stop major expansion**.

Keep the raw participant material private. Publish only aggregate, non-identifying evidence if publication is useful and consent permits it.
