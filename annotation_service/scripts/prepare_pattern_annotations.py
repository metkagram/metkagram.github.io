"""Generate static spaCy annotations for every sentence in every reusable pattern."""
from __future__ import annotations

import gzip
import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))
import main

ROOT = SERVICE_ROOT.parent
patterns = json.loads((ROOT / "data" / "advanced-patterns.json").read_text())
main.MODELS = {language: main._load_model(language) for language in main.MODEL_NAMES}
if not all(model.has_pipe("parser") for model in main.MODELS.values()):
    raise SystemExit("Trained spaCy pipelines are required; run scripts/install_models.py first.")

work = []
for pattern in patterns:
    for language in pattern["langs"]:
        work.append((f'{pattern["id"]}:{language["lang"]}:primary', language["lang"], language["example"].replace("**", ""), pattern["set_id"]))
        for index, example in enumerate(language.get("examples", []), start=1):
            work.append((f'{pattern["id"]}:{language["lang"]}:{index}', language["lang"], example["text"].replace("**", ""), pattern["set_id"]))

items = {}
for start in range(0, len(work), 256):
    chunk = work[start:start + 256]
    requests = [main.AnnotationRequest(text=text, language=language) for _, language, text, _ in chunk]
    for (key, _, _, set_id), annotation in zip(chunk, main.annotate_many(requests)):
        record = annotation.model_dump()
        record["source"] = {"dataset": "advanced-patterns", "set_id": set_id, "pattern_example_id": key}
        items[key] = record
    print(f"Annotated {min(start + len(chunk), len(work))}/{len(work)} sentences")

output = {"schema_version": main.SCHEMA_VERSION, "models": {language: model.meta["version"] for language, model in main.MODELS.items()}, "count": len(items), "items": items}
target = ROOT / "data" / "pattern-annotations.json.gz"
with gzip.open(target, "wt", encoding="utf-8", compresslevel=9) as handle:
    json.dump(output, handle, ensure_ascii=False, separators=(",", ":"))
print(f"Wrote {target} with {len(items)} annotated sentences")
