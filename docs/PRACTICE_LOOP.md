# Metkagram active practice loop

Status: implemented in the public web product.

## Purpose

The practice loop turns a published pattern from a passive reference object into a short retrieval task:

> **inspect the move → produce a new example → check the frame → self-rate retrieval → revisit the same pattern later**

The loop is deliberately small. It does not introduce accounts, streaks, social features or a general AI chat surface.

## User flow

1. A learner opens a stable pattern page, directly or from Pattern Lens.
2. Metkagram shows the reasoning goal and the selected English or German formula.
3. The learner writes a new example before receiving feedback.
4. The browser checks whether stable literal parts of the published formula are visible in the attempt.
5. The learner self-rates the retrieval as `Needs work` or `Got it`.
6. The attempt and next review date are stored locally under the same stable pattern ID and target language.
7. The Practice index exposes a local review queue when saved patterns become due.

Pattern Lens result links point directly to the active-practice section of the selected pattern.

## Feedback boundary

The public practice checker is intentionally conservative.

It may say that the published structural frame is detected, partially detected, not detected, or not suitable for simple literal checking. It does **not** claim that the whole sentence is grammatically correct, natural, semantically appropriate or equivalent to the reference examples.

This distinction matters because a deterministic browser check is useful as a retrieval cue but is not a substitute for linguistic evaluation. A future AI tutor may provide richer feedback around the same stable pattern object, but the canonical pattern and review history remain separate from model output.

## Local review state

Progress from retrieval practice is stored only in the learner's browser at:

`metkagram:practice:v1`

The primary key is:

`PATTERN_ID:language`

Each saved item keeps the stable pattern ID, target language, recent attempts, the last structural signal, self-rating, current interval, streak, review timestamp and due timestamp.

The public implementation intentionally avoids accounts and server-side learner profiles at this stage.

### Reader completion is separate

Pattern pages also provide a lightweight `complete / not complete` marker for simple reading progress. It is stored separately at:

`metkagram:pattern-progress:v1`

This completion flag must not be interpreted as a successful retrieval attempt and must not advance the Active Practice schedule. Browsers that support WebMCP may read or update this lightweight completion marker through the tools documented in `docs/WEBMCP.md`.

## Initial scheduling rule

The scheduling policy is deliberately understandable rather than pretending to be an optimised memory model:

- `Needs work` → review in 1 day and reset the successful-retrieval streak;
- first `Got it` → review in 3 days;
- later `Got it` → double the previous interval, with a 3-day minimum and 30-day cap.

This policy is a product heuristic, not a research claim about optimal spacing. It should be changed only with explicit product or study rationale.

## Implementation

- `public/assets/practice-loop-core.js` contains deterministic formula matching and scheduling functions.
- `public/assets/practice-loop.js` renders the local practice and review-queue interface.
- `public/assets/pattern-progress-core.js` owns lightweight pattern-page completion state.
- `public/assets/lens-practice-bridge.js` routes Pattern Lens matches into the practice section.
- `scripts/active-practice.mjs` attaches these modules to generated production pages.
- `tests/practice-loop.test.mjs` covers structural matching, interval behaviour and the separation between reader completion and retrieval practice.

## Research relevance

The loop creates a concrete surface for the existing retrieval hypothesis in `RESEARCH_PROGRAM.md`: a learner attempts production before feedback and returns to the same versioned learning object later.

Local product usage is not itself evidence that retrieval improves learning. A controlled study still needs predefined outcomes, comparison conditions and delayed testing.
