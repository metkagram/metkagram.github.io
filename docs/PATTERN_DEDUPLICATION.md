# Pattern structural deduplication

Metkagram treats one reusable language frame as one canonical Pattern. Historical slot-value expansion created many records whose English and German formulas differed only in the values written inside square-bracket slots. Those records were generated examples, not distinct learning objects.

## Canonical rule

Two records are structural duplicates only when all of the following are true:

- they belong to the same study set;
- their normalized English formulas are identical after square-bracket slot contents become `[]`;
- their normalized German formulas are identical under the same rule.

The first stable record in study-set order remains canonical. Retired IDs are recorded in `data/pattern-aliases.json`. Similar-looking constructions with different grammar or communicative function are not merged by this rule.

## 2026-09-17 migration

- base records before structural deduplication: **3,436**
- canonical base Patterns after deduplication: **536**
- retired slot-expansion IDs: **2,900**
- final merged active corpus, including reviewed supplemental Frames: **630**

Precomputed Practice annotations for retired IDs were removed with the records. The build validates that active Patterns remain structurally unique under this conservative same-set EN+DE rule.
