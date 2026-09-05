# Editorial annotations for corrected Practice text

The public dependency cache in `data/pattern-annotations.json.gz` is an immutable
export from the private annotation service. Correcting a source sentence makes its
cached annotation stale. The build must never apply old offsets to new text.

`src/practice-annotations.mjs` validates that cache and overlays prepared records
from `data/pattern-annotation-overrides.json`. Unchanged records retain their
complete existing dependency annotations. The 909 changed PRO/ARG records contain
only fixed-frame annotations: known subjects, verbs and helpers in invariant syntax,
plus reusable fragments. Variable slots are not dependency-parsed or tagged.
Each record explicitly identifies `editorial-fixed-frame-v1`,
`coverage: fixed-frame-only` and `dependency_parse: false`.

The public release contains outputs and read-only integrity checks. Preparation
code and annotation rules remain outside the public repository under the existing
`PUBLICATION_BOUNDARY.md`. A historical `provenance.script` value identifies the
local preparation step; it does not imply that its implementation is published.

Run:

```sh
node scripts/check-editorial-annotations.mjs
node --test tests/practice-annotations.test.mjs tests/publication-boundary.test.mjs
```

Every record must match its exact source key, language, set and text. Its provenance
binds it to the original cache record ID/SHA-256 and the new source-text SHA-256.
Generic schema validation checks spans and offsets. The full prepared payload is
also bound to `data/pattern-annotation-integrity.json`, a deterministic SHA-256
fingerprint over `JSON.stringify(payload)`. Changes to roles, in-bounds offsets,
provenance or other fields invalidate that fingerprint. The fingerprint protects
against accidental changes; it is not proof of independent linguistic review.

There is deliberately no public command that generates annotations or refreshes
the integrity fingerprint. Future editorial changes need a new prepared export
from the private workflow, inspection of the changed text and annotations, and an
explicit update to the integrity record. Do not update the fingerprint simply to
make a failing test pass. Unknown IDs, changed source text, changed cache records,
incorrect spans and obsolete overrides fail the build.

After a full service regeneration, a new prepared sidecar should omit records
whose text now matches the refreshed dependency cache. Those sentences then use
the complete service annotations. The current loader rejects an unnecessary old
override, so this transition must be deliberate.

This layer makes editorial corrections safe to publish with precise provenance.
It does not claim a new full parser run, independent human language review, CEFR
validation or measured learning effectiveness.
