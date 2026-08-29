from fastapi.testclient import TestClient

from intel import analyze
from main import app
from tests.conftest import analyze_payload, make_state


client = TestClient(app)


def _post(request):
    response = client.post("/model/analyze", json=request.model_dump(mode="json"))
    assert response.status_code == 200, response.text
    return response.json()


def test_worsening_chain():
    history = [
        make_state(-60, delay=0, concentration=20, congestion=20, rain=0, camp_load=25, ambulances=(4, 4)),
        make_state(-45, delay=8, concentration=40, congestion=35, rain=6, camp_load=35, ambulances=(4, 4)),
        make_state(-30, delay=18, concentration=55, congestion=55, rain=12, camp_load=50, ambulances=(3, 4)),
        make_state(-15, delay=28, concentration=70, congestion=70, rain=18, camp_load=70, ambulances=(2, 4)),
    ]
    current = make_state(
        0,
        delay=40,
        concentration=85,
        congestion=85,
        rain=22,
        camp_load=92,
        ambulances=(1, 5),
        medicine=20,
        referrals=3,
        blocked=True,
    )
    body = _post(analyze_payload(current, history))
    assert body["change"]["direction"] == "worsening"
    assert body["situation_class"] in {"rapidly_worsening", "newly_critical"}
    assert body["risk_score"] >= 50
    assert body["status"] in {"HIGH", "CRITICAL"}
    assert any(gap["resource"] == "ambulances" for gap in body["resource_gaps"])
    assert body["priority_actions"]


def test_improving_conditions():
    history = [
        make_state(-60, delay=40, concentration=80, congestion=80, rain=20, camp_load=90, ambulances=(1, 5), medicine=20),
        make_state(-40, delay=28, concentration=65, congestion=60, rain=10, camp_load=70, ambulances=(3, 5), medicine=40),
        make_state(-20, delay=12, concentration=40, congestion=35, rain=2, camp_load=45, ambulances=(4, 5), medicine=70),
    ]
    current = make_state(
        0,
        delay=4,
        concentration=25,
        congestion=20,
        rain=0,
        camp_load=30,
        ambulances=(5, 5),
        medicine=90,
    )
    body = _post(analyze_payload(current, history))
    assert body["change"]["direction"] == "improving"
    assert body["situation_class"] == "improving"
    assert body["status"] in {"NORMAL", "ELEVATED"}
    assert body["risk_score"] < 40


def test_resolved_after_high_pressure():
    from schemas import Incident

    history = [
        make_state(-40, delay=50, camp_load=95, ambulances=(0, 4), concentration=80, congestion=80),
        make_state(-20, delay=30, camp_load=70, ambulances=(2, 4), concentration=50, congestion=50),
    ]
    current_state = make_state(0, delay=2, camp_load=20, ambulances=(4, 4), concentration=15, congestion=10)
    current_state.incidents = [
        Incident(
            id="inc-1",
            category="crowd",
            severity="high",
            status="resolved",
            description="Crowd surge cleared",
            authority="Police Authority",
        )
    ]
    body = analyze(analyze_payload(current_state, history)).model_dump()
    assert body["situation_class"] == "resolved"
    assert body["risk_score"] < 25
    assert body["status"] == "NORMAL"


def test_multi_domain_emergency():
    current = make_state(
        0,
        delay=50,
        concentration=90,
        camp_load=95,
        ambulances=(0, 6),
        medicine=10,
        congestion=90,
        blocked=True,
        rain=25,
        water=20,
        sanitation=25,
        halt=30,
        referrals=5,
    )
    history = [
        make_state(-45, delay=20, concentration=50, camp_load=50, congestion=40, rain=8),
        make_state(-30, delay=30, concentration=70, camp_load=70, congestion=60, rain=15, ambulances=(2, 6)),
        make_state(-15, delay=40, concentration=80, camp_load=85, congestion=80, rain=20, ambulances=(1, 6)),
    ]
    body = _post(analyze_payload(current, history))
    ids = {item["id"] for item in body["correlations"]}
    assert "multi_domain_emergency" in ids
    assert body["status"] == "CRITICAL"
    assert body["risk_score"] >= 75
    assert len(body["resource_gaps"]) >= 2
    assert any("Medical" in factor or "medical" in factor.lower() for factor in body["key_factors"] + [body["headline"]])


def test_duplicate_suppression():
    current = make_state(0, delay=25, concentration=60, camp_load=70, congestion=55)
    history = [make_state(-30, delay=22, concentration=58, camp_load=68, congestion=52)]
    first = analyze(analyze_payload(current, history))
    second_req = analyze_payload(
        current,
        history,
        previous_fingerprint=first.fingerprint,
        previous_risk_score=first.risk_score,
        previous_situation_class=first.situation_class,
    )
    second = analyze(second_req)
    assert second.fingerprint == first.fingerprint
    assert second.suppressed is True
    assert second.suppression_reason
    assert all(action.suppressed for action in second.priority_actions)


def test_no_suppression_when_state_changes():
    quiet = make_state(0, delay=5, camp_load=20)
    stressed = make_state(0, delay=45, camp_load=95, ambulances=(0, 4), concentration=90, congestion=85)
    first = analyze(analyze_payload(quiet, [make_state(-20)]))
    second = analyze(
        analyze_payload(
            stressed,
            [make_state(-20)],
            previous_fingerprint=first.fingerprint,
            previous_risk_score=first.risk_score,
            previous_situation_class=first.situation_class,
        )
    )
    assert second.suppressed is False
    assert second.fingerprint != first.fingerprint
