from fastapi.testclient import TestClient

from main import app
from schemas import AnalyzeResponse
from tests.conftest import analyze_payload, make_state


client = TestClient(app)

RESPONSE_FIELDS = {
    "location_id",
    "location_name",
    "analyzed_at",
    "model_version",
    "risk_score",
    "status",
    "headline",
    "key_factors",
    "change",
    "situation_summary",
    "situation_class",
    "resource_gaps",
    "emerging_risks",
    "priority_actions",
    "correlations",
    "data_freshness",
    "confidence",
    "readiness",
    "domain_scores",
    "suppressed",
    "suppression_reason",
    "fingerprint",
    "deterministic",
    "phrasing_source",
}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_rejects_empty_location():
    payload = analyze_payload(make_state()).model_dump(mode="json")
    payload["location_id"] = ""
    response = client.post("/model/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_normal_schema_complete():
    payload = analyze_payload(make_state(), [make_state(-40), make_state(-25), make_state(-10)])
    response = client.post("/model/analyze", json=payload.model_dump(mode="json"))
    assert response.status_code == 200, response.text
    body = response.json()
    assert RESPONSE_FIELDS <= set(body)
    parsed = AnalyzeResponse.model_validate(body)
    assert parsed.status == "NORMAL"
    assert parsed.risk_score < 25
    assert parsed.deterministic is True
    assert parsed.phrasing_source == "deterministic"
    assert parsed.data_freshness.history_ticks == 3
    assert parsed.headline
    assert parsed.situation_summary
    assert parsed.fingerprint
    assert parsed.readiness.overall > 70
    assert 0 <= parsed.confidence.score <= 1
    domain_names = {item.domain for item in parsed.domain_scores}
    assert {
        "palkhi",
        "dindi",
        "medical",
        "traffic",
        "municipal",
        "sanitation",
        "weather",
        "halt",
        "incidents",
    } <= domain_names
