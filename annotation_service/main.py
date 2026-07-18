"""Optional local annotation API.

The GitHub Pages site consumes generated JSON, not this process. This API is for
editorial preview and deterministic local generation; spaCy models are optional.
"""
from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SCHEMA_VERSION = "1.0.0"
MODELS = {}
MODEL_NAMES = {"en": os.getenv("METKAGRAM_SPACY_EN_MODEL", "en_core_web_sm"), "de": os.getenv("METKAGRAM_SPACY_DE_MODEL", "de_core_news_sm")}


class Span(BaseModel):
    id: str
    start: int
    end: int
    type: str
    label: str
    role: Optional[str] = None


class AnnotationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    language: Literal["en", "de"]
    locale: Optional[str] = None


class CanonicalAnnotation(BaseModel):
    schema_version: str = SCHEMA_VERSION
    id: str
    kind: Literal["sentence"] = "sentence"
    text: str
    inline_text: str
    language: str
    locale: str
    translations: dict[str, str] = {}
    explanation: str = ""
    examples: list = []
    difficulty: Optional[str] = None
    cefr: Optional[str] = None
    source: dict
    slots: list = []
    spans: list[Span]
    validation: dict


def _load_model(language: str):
    """Load the installed trained pipeline; use a marked fallback only in local dev."""
    try:
        import spacy
        return spacy.load(MODEL_NAMES[language])
    except OSError:
        # The service remains useful immediately after dependency install, but health
        # makes this degraded state visible and setup installs the real pipelines.
        import spacy
        pipeline = spacy.blank(language)
        pipeline.add_pipe("sentencizer")
        return pipeline


@asynccontextmanager
async def lifespan(_: FastAPI):
    global MODELS
    MODELS = {language: _load_model(language) for language in MODEL_NAMES}
    yield
    MODELS = {}


app = FastAPI(title="Metkagram annotation service", version=SCHEMA_VERSION, lifespan=lifespan)
origins = [origin for origin in os.getenv("METKAGRAM_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


def annotate(text: str, language: str, locale: Optional[str] = None) -> CanonicalAnnotation:
    nlp = MODELS[language]
    doc = nlp(text)
    spans: list[Span] = []
    role_map = {"nsubj": ("subject", "S", "subject"), "nsubj:pass": ("subject", "S", "passive subject"), "sb": ("subject", "S", "subject"), "ROOT": ("verb", "V", "main verb"), "oc": ("verb", "v2", "verb complement"), "aux": ("helper", "Hf", "verb helper"), "aux:pass": ("helper", "Hst", "passive helper"), "obj": ("function", "p2", "object"), "dobj": ("function", "p2", "object"), "iobj": ("function", "p2", "indirect object"), "oa": ("function", "p2", "accusative object"), "da": ("function", "p2", "dative object")}
    for token in doc:
        item = role_map.get(token.dep_)
        if item:
            span_type, label, role = item
            spans.append(Span(id=f"s{len(spans)+1}", start=token.idx, end=token.idx + len(token.text), type=span_type, label=label, role=role))
    if not spans:
        words = list(re.finditer(r"[^\W\d_]+", text, flags=re.UNICODE))
        if words:
            first = words[0]
            spans.append(Span(id="s1", start=first.start(), end=first.end(), type="subject", label="S", role="subject cue"))
    spans.sort(key=lambda span: (span.start, span.end))
    for index, span in enumerate(spans, start=1):
        span.id = f"s{index}"
    model_loaded = bool(nlp.has_pipe("parser"))
    return CanonicalAnnotation(id=f"local-{abs(hash((text, language))) & 0xffffffff:x}", text=text, inline_text=text, language=language, locale=locale or language, source={"dataset": "annotation_service", "set_id": None}, spans=spans, validation={"generator": "spacy-dependency" if model_loaded else "tokenizer-fallback", "spacy_model": MODEL_NAMES[language], "spacy_loaded": model_loaded, "status": "valid"})


@app.get("/health")
def health():
    return {"status": "ok", "schema_version": SCHEMA_VERSION, "models": {language: {"name": MODEL_NAMES[language], "dependency_parser": model.has_pipe("parser")} for language, model in MODELS.items()}}


@app.post("/v1/annotate", response_model=CanonicalAnnotation)
def annotate_post(request: AnnotationRequest):
    return annotate(request.text, request.language, request.locale)


@app.get("/{language}/annotate/{text}", response_model=CanonicalAnnotation, deprecated=True)
def annotate_legacy(language: str, text: str):
    if language not in {"en", "de"}:
        raise HTTPException(status_code=404, detail="Supported languages: en, de")
    return annotate(text, language)
