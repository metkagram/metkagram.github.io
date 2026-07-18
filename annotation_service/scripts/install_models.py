"""Install and verify the explicit, compatible spaCy language pipelines."""
from __future__ import annotations

import subprocess
import sys

MODELS = ("en_core_web_sm", "de_core_news_sm")

for model in MODELS:
    subprocess.run([sys.executable, "-m", "spacy", "download", model], check=True)

subprocess.run([sys.executable, "-m", "spacy", "validate"], check=True)
