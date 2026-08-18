# Russian-speaker transfer error layer

Metkagram exposes a reviewed learner-facing layer for recurring Russian → English transfer errors.

## Canonical data

- `data/russian-speaker-errors.json` — editorial error map, search titles, explanations and pattern links.
- `data/reasoning-frames/russian-transfer-extension-v2.json` — reusable EN/DE practice objects used by the error pages.

## Generated surfaces

- `/en/mistakes/russian-speakers/`
- `/ru/mistakes/russian-speakers/`
- one localized page per reviewed error
- `/data/russian-speaker-errors.json`
- `/api/v1/russian-speaker-errors.json`

Every error page links to a stable Practice pattern ID. Practice pages link back to the error explanation, so the learner can move between diagnosis and production rather than reading a disconnected grammar article.

## Editorial boundary

The layer describes recurring L1 → L2 transfer patterns. It does not claim that every Russian-speaking learner makes every listed error, and it does not infer a learner's first language from a single mistake.

Research references are stored with the error-map dataset. Metkagram examples and explanations remain editorial learning content rather than reported experimental findings.
