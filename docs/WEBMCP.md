# WebMCP pattern progress

Status: experimental progressive enhancement.

Metkagram pattern pages expose lightweight learner progress through the emerging WebMCP browser API while keeping the normal human interface fully functional without WebMCP.

## Product boundary

A learner can mark a pattern page as complete with the compact reader control. That completion state means only that the learner chose to mark the pattern as completed/read. It is deliberately separate from Active Practice retrieval results and spaced-review scheduling.

Pattern completion is stored locally at:

`metkagram:pattern-progress:v1`

Active Practice continues to use:

`metkagram:practice:v1`

This prevents a simple page-completion click from being treated as evidence that the learner successfully retrieved or produced the language pattern.

## WebMCP tools

When the browser exposes `document.modelContext.registerTool`, a pattern page registers three tools:

- `metkagram_get_pattern_progress` — read completion state for the current pattern;
- `metkagram_set_pattern_progress` — mark the current pattern complete or remove the mark;
- `metkagram_get_progress_summary` — read the browser-local completed count and a bounded list of recently completed pattern IDs.

The read tools declare `readOnlyHint`. The write tool changes only browser-local progress and does not write canonical Metkagram data, practice attempts, accounts, or server state.

## Compatibility

WebMCP is not required for Metkagram to work. `public/assets/pattern-reading.js` feature-detects the browser API and registers tools only when it is present. The same progress state remains available through the ordinary page control in browsers without WebMCP.

As of 17 September 2026, WebMCP is still a Community Group draft and Chrome documents its implementation as an origin trial / experiment. Do not make core learning flows depend on it until browser support is stable.

No origin-trial token is committed here. Such tokens are origin-specific deployment credentials/metadata and should be added only through an explicit deployment decision.

References:

- https://webmachinelearning.github.io/webmcp/
- https://developer.chrome.com/docs/ai/webmcp/imperative-api

## Files

- `public/assets/pattern-progress-core.js` owns the versioned completion-state format and deterministic helpers.
- `public/assets/pattern-reading.js` renders the completion control and registers WebMCP tools.
- `public/assets/pattern-reading.css` keeps the control aligned with the simplified reader UI.
- `tests/practice-loop.test.mjs` protects the separation between completion state and Active Practice state.
