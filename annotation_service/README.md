# Metkagram annotation service

This optional FastAPI service is for local editorial previews. Production annotation data is generated at build time by `../scripts/annotations.mjs` and published as static assets, so GitHub Pages has no runtime backend dependency.

## Run

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python scripts/install_models.py
cp .env.example .env
.venv/bin/uvicorn main:app --reload --port 8080
```

`GET /health` verifies startup. `POST /v1/annotate` accepts `{ "text": "I will study.", "language": "en" }` and returns a canonical `1.0.0` record. The older `/{en|de}/annotate/{text}` routes remain as deprecated compatibility adapters.

The service uses spaCy 3.8.7 with the explicitly installed `en_core_web_sm` and `de_core_news_sm` dependency pipelines. It degrades visibly to tokenization only if a model is missing; `GET /health` exposes whether each dependency parser loaded. No cloud credentials are required or read; credential-like legacy files are deliberately ignored.
