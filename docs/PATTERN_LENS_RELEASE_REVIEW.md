# Pattern Lens release review protocol

Status: release-review collection open; statistical precision claims blocked until the reviewed target is complete.

## Why there are two evaluation layers

Pattern Lens already has a hard engineering regression fixture. That fixture is useful for preventing obvious regressions, but it is small and hand-authored around known failure modes. It must not be renamed into a statistical precision estimate merely because the current numbers look good.

Metkagram therefore separates:

1. **engineering regression** — the current frozen hard cases that can block a code/content regression now;
2. **release review** — a larger human-reviewed EN/DE set used before making stronger precision/abstention claims.

The machine-readable policy lives in `data/evaluation/pattern-lens-release-policy.json`. Current readiness is generated at `/data/pattern-lens-release-readiness.json`.

## Release-review target

At least **150 human-reviewed cases** are required. The target deliberately covers both languages and several failure families:

- positive generalisation beyond exact wording;
- misleading near-matches;
- metalinguistic mentions of a cue rather than actual use;
- incomplete Frames;
- ambiguous sentences where abstention is safer;
- neutral negatives with no supported reusable Frame.

The bucket minima in the policy sum to the full 150-case target. Hitting 150 by overfilling one easy category does not make the set ready.

## What counts as reviewed

A case counts only when it is stored in `data/evaluation/pattern-lens-release-review.json` with:

- a stable case ID;
- language;
- sentence;
- positive/negative kind;
- error/pattern family;
- expected Pattern and Move for positive cases;
- `review.status = reviewed`;
- reviewer identifier;
- review date;
- `independent_of_generation = true`;
- review notes.

Generated candidate cases, model suggestions and unreviewed drafts do **not** count toward release coverage. A syntactically valid JSON row is not a reviewer. Humanity survives another small administrative victory.

## Precision-first release metrics

The policy is intentionally stricter than the current engineering fixture:

- overall false-positive rate ≤ 5%;
- positive Pattern hit@3 ≥ 90% per language once the slice is large enough;
- clear-negative abstention ≥ 95% per language;
- family-specific abstention targets for near-match, metalinguistic, incomplete, ambiguous and neutral negatives;
- no statistical slice is evaluated until its minimum sample size is present.

The policy also keeps a regression budget for the frozen engineering set: new false positives are not silently traded for more recall.

## Review workflow

1. Collect candidate sentences separately from the reviewed file.
2. Remove duplicates and trivial exact copies of known formulas.
3. Assign a target bucket before review.
4. Ask a human reviewer to classify the sentence without seeing a desired metric outcome.
5. Record the reviewed label and provenance.
6. Run `npm run verify`.
7. Inspect `/data/pattern-lens-release-readiness.json` for coverage and slice gates.
8. Freeze a completed reviewed set before comparing future system versions against it.

## Evidence boundary

Until coverage and all configured slice gates are complete, public pages may report bounded engineering-regression results, but must not describe Pattern Lens as having independently established statistical precision or recall.

This protocol measures retrieval/abstention behavior. It is not evidence that Pattern Lens improves language-learning outcomes.
