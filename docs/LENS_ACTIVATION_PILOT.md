# Pattern Lens activation pilot

Status: pilot protocol and local analysis tooling. This document does not claim learner demand or learning efficacy before real independent participants complete the study.

## Decision question

Does the public Pattern Lens loop create enough independent learner pull to justify deeper product expansion?

Core loop under test:

**real sentence → reviewed match → own example → structural check → reviewed continuation**

The primary behavioral unit is a **Useful Reuse Session**. It requires, within one Lens session:

1. a `lens_analyze` event that returned the same Pattern later practised;
2. a `lens_practice_attempt` for that Pattern;
3. a `lens_practice_complete` for that Pattern.

This is an activation signal, not proof that the match was useful, that the learner retained it, or that language ability improved.

## Participants

Start with at least 10 independent B2–C1 English/German learners outside the project implementation loop. Prefer learners who understand substantially more language than they feel able to produce naturally.

Do not teach Metkagram terminology before the first session. The entry point must make enough sense on its own.

Each participant should bring real sentences or ideas they encountered or wanted to express. Prepared demo prompts can be used only as a fallback, not as the entire session.

## What the site records locally

The public site already records a minimal local-only event stream in the learner's browser:

- `lens_analyze` — analysis submitted; only result count and Pattern ids are recorded;
- `lens_practice_attempt` — the learner began their own example;
- `lens_practice_complete` — the structural check was completed;
- `learning_object_open` — a reviewed continuation was opened.

Raw learner text is not part of the learning-event schema. Events remain in local browser storage unless the learner explicitly exports them.

## Participant consent and export

For a pilot participant:

1. explain that activity telemetry is stored locally in their browser;
2. ask for explicit permission before requesting an export;
3. let the participant export the JSON themselves from the Learning Activity page;
4. store participant files only in a private/local directory such as `data/lens-activation/private/`;
5. do not commit participant exports to Git;
6. do not combine participant identity with the aggregate report unless the research protocol separately requires and protects it.

The repository ignores both `data/lens-activation/private/` and `reports/lens-activation/private/`.

## Behavioral analysis

Run:

```bash
npm run lens:activation -- \
  --input data/lens-activation/private/ \
  --repeat-after-days 2
```

The analyzer reads one explicit learning-activity export per participant and writes aggregate-only output to:

- `reports/lens-activation/private/lens-activation.json`
- `reports/lens-activation/private/lens-activation.md`

The report does not copy event ids, session ids, filenames or participant identifiers.

### First-session funnel

The report counts:

1. `analysis_started` — participant used Lens;
2. `match_returned` — Lens returned at least one reviewed Pattern;
3. `practice_attempt` — participant started an own-example attempt;
4. `practice_complete` — participant completed the structural check;
5. `useful_reuse` — the same Pattern moved through reviewed match → attempt → completed structural check;
6. `continuation_after_reuse` — participant opened another learning object after the reuse loop.

`match_returned` is deliberately **not** named `useful_match`. Retrieval output cannot tell us whether a learner found it useful.

### Repeat pull

`repeat_pull` means the same participant export contains a later Lens analysis session at least the configured number of days after their first Lens analysis. The default threshold is two days.

Repeat pull is stronger than first-session completion, but still does not establish retention or learning efficacy.

## Qualitative evidence remains mandatory

Telemetry cannot answer the most important interpretation questions. After the first session, ask briefly:

- What was useful?
- What was unclear?
- What did you expect to happen next?
- Would you use this with your own language again? For what kind of situation?

Record negative and confused responses. Do not reinterpret `match_returned` or `practice_complete` as positive feedback.

When inviting a subset back after several days, do not tell them which Pattern or exact workflow to repeat. Observe whether they independently bring new language into Lens.

## Decision gate

After at least 10 independent learners complete a first session, choose one dated outcome:

- **continue** — repeated independent use and Useful Reuse Sessions justify deeper product work;
- **narrow** — one learner job or audience performs materially better than the rest;
- **repair** — the value is understood but retrieval or UX blocks activation;
- **research/reference only** — learners value the corpus but do not adopt the workflow;
- **stop major product expansion** — there is no meaningful pull despite a usable flow.

Do not change the success interpretation after seeing the result solely to make the pilot positive.

## Evidence boundaries

The analyzer is designed to preserve these distinctions:

- engineering retrieval benchmark ≠ user helpfulness;
- reviewed match returned ≠ useful match;
- Useful Reuse Session ≠ retention;
- repeat pull ≠ learning efficacy;
- telemetry ≠ qualitative explanation;
- generated or project-internal sessions ≠ independent-user evidence.

A null or negative pilot result is a valid project result and should change the product decision.
