# Privacy-safe learning telemetry

## Purpose

Metkagram needs evidence about whether its learning loop is useful, but a static research project does not need to become a surveillance product to get that evidence.

The first telemetry layer is therefore **local-first and learner-controlled**.

It records a small vocabulary of learning actions in the browser so a learner can inspect their own trail and, if they choose, export it as JSON for a research conversation or debugging session.

There is no automatic upload endpoint.

## Event vocabulary

Schema: `data/learning-event.schema.json`

The reviewed v1 vocabulary contains six events:

- `lens_analyze` — Pattern Lens was submitted; stores only result count and returned pattern IDs, never the learner text.
- `learning_object_open` — a learner followed a canonical pattern, contrast, drill, pack, transfer or export link.
- `clinic_feedback_reveal` — Choice Clinic feedback was revealed.
- `pack_step_open` — a canonical object was opened from a Reasoning Pack.
- `transfer_feedback_reveal` — an EN↔DE transfer answer was revealed.
- `export_download` — a public teacher/tutor export was explicitly downloaded.

## Privacy boundary

The runtime stores only:

- event type;
- random event ID;
- random current-tab session ID;
- timestamp;
- interface locale;
- current path;
- product surface;
- stable public object IDs;
- a small allowlisted metadata object such as Lens result IDs, transfer direction or export format.

It deliberately does **not** store:

- Pattern Lens input or other learner-authored text;
- names or email addresses;
- IP addresses;
- account IDs;
- persistent cross-session user IDs;
- analytics cookies;
- referrer histories;
- device fingerprints.

The current-tab session ID lives in `sessionStorage`. Events live in `localStorage` under `metkagram.learning_events.v1` and are capped at 1,000 records.

## No automatic network transport

`public/assets/learning-events.js` must not use:

- `fetch`;
- `navigator.sendBeacon`;
- `XMLHttpRequest`;
- `WebSocket`;
- `EventSource`.

Regression tests enforce this boundary.

If Metkagram later runs a real opt-in research study, consent, study protocol, participant IDs, collection endpoints and retention rules must be designed as a separate research system. This local event log must not quietly mutate into remote analytics.

## Learner controls

Localized activity pages are generated at:

- `/en/activity/`
- `/ru/activity/`

They show:

- total local events;
- current-browser session count represented in the retained log;
- counts by event type;
- the 50 most recent events;
- explicit JSON export;
- explicit local clear action.

The privacy page also explains this local storage.

## Research use

This layer does not produce population-level analytics by itself. That is intentional.

It creates a reproducible event contract that can support later bounded studies. For example, a participant may explicitly export their local log after a study session. Researchers can then analyse transitions such as:

`Lens → pattern → contrast → clinic → pack → transfer → practice`

without collecting the sentence the participant originally pasted into Lens.

Useful future measures include:

- Lens result → canonical pattern open rate;
- contrast → Clinic transition;
- Clinic reveal → practice navigation;
- Reasoning Pack step progression;
- transfer reveal frequency and direction;
- teacher/tutor export use during a bounded pilot.

None of these should be presented as learning efficacy metrics without a suitable study design.

## Machine-readable contract

The event schema is published at:

- `/data/learning-event.schema.json`
- `/api/v1/learning-event-schema.json`

The static MCP manifest exposes the schema only. It does not expose a learner's browser-local events. A remote agent cannot retrieve those events unless the learner explicitly exports and supplies the file.
