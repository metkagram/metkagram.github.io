from fastapi.testclient import TestClient
from main import app


def test_health_and_annotation_workflow():
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["schema_version"] == "1.0.0"
        assert set(health.json()["models"]) == {"en", "de"}
        response = client.post("/v1/annotate", json={"text": "I will study today.", "language": "en"})
        assert response.status_code == 200
        body = response.json()
        assert body["text"] == "I will study today."
        assert body["spans"][0]["start"] == 0
        assert body["validation"]["generator"] in {"spacy-dependency", "tokenizer-fallback"}


def test_unicode_offsets_and_language_validation():
    with TestClient(app) as client:
        response = client.post("/v1/annotate", json={"text": "Ich werde heute lernen.", "language": "de"})
        assert response.status_code == 200
        subject = next(span for span in response.json()["spans"] if span["label"] == "S")
        assert subject["start"] == 0 and subject["end"] == 3
        assert client.post("/v1/annotate", json={"text": "x", "language": "fr"}).status_code == 422


def test_batch_annotation_preserves_request_order():
    with TestClient(app) as client:
        response = client.post("/v1/annotate/batch", json={"items": [{"text": "I will learn.", "language": "en"}, {"text": "Ich werde lernen.", "language": "de"}]})
        assert response.status_code == 200
        assert [item["text"] for item in response.json()] == ["I will learn.", "Ich werde lernen."]
        assert all(item["validation"]["spacy_loaded"] for item in response.json())


def test_german_annotations_include_noun_gender_and_past_tense():
    with TestClient(app) as client:
        response = client.post("/v1/annotate", json={"text": "Die Frau gewann mit dem Mann.", "language": "de"})
        assert response.status_code == 200
        spans = response.json()["spans"]
        assert next(span for span in spans if span["gender"] == "feminine")["start"] == 4
        assert next(span for span in spans if span["gender"] == "masculine")["start"] == 24
        assert next(span for span in spans if span["label"] == "V")["tense"] == "past"
