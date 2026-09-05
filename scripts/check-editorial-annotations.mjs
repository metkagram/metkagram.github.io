// Read-only validation of prepared public annotations. Preparation and linguistic
// rule generation are deliberately not part of this public release.
import { loadContent } from "../src/content.mjs";
import { loadPatternAnnotations } from "../src/practice-annotations.mjs";

const records = loadPatternAnnotations(loadContent());
console.log(`Verified ${Object.keys(records).length} source-bound Practice annotations and the editorial export fingerprint.`);
