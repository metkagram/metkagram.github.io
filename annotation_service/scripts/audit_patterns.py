"""Audit every reusable pattern primary example with the installed spaCy models."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import spacy

ROOT = Path(__file__).resolve().parents[2]
patterns = json.loads((ROOT / "data" / "advanced-patterns.json").read_text())
models = {"en": spacy.load("en_core_web_sm"), "de": spacy.load("de_core_news_sm")}
items = [(lang["lang"], pattern["id"], lang["examples"][0]["text"].replace("**", "")) for pattern in patterns for lang in pattern["langs"] if lang.get("examples")]
report = {"patterns": len(patterns), "representative_natural_examples": len(items), "models": {}, "languages": {}}

for language, nlp in models.items():
    subset = [(text, identifier) for item_language, identifier, text in items if item_language == language]
    dependencies = Counter()
    root_count = subject_count = 0
    for doc, _ in nlp.pipe(subset, as_tuples=True, batch_size=64):
        dependencies.update(token.dep_ for token in doc)
        root_count += any(token.dep_ == "ROOT" for token in doc)
        subject_count += any(token.dep_ in ({"en": {"nsubj", "nsubj:pass"}, "de": {"sb"}}[language]) for token in doc)
    report["models"][language] = nlp.meta["version"]
    report["languages"][language] = {"examples": len(subset), "root_coverage": root_count / len(subset), "subject_coverage": subject_count / len(subset), "top_dependencies": dependencies.most_common(12)}

target = ROOT / "reports" / "spacy-pattern-audit.json"
target.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
