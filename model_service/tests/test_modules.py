from datetime import timedelta

from correlation import detect_correlations
from freshness import assess_freshness
from gaps import detect_gaps
from rate import overall_rate_per_hour
from scoring import score_state
from tests.conftest import make_state, ticks, utc
from trends import detect_trends


def test_trend_worsening_and_improving():
    previous = make_state(-20, camp_load=30, congestion=20)
    worse = make_state(0, camp_load=90, congestion=80)
    better = make_state(0, camp_load=10, congestion=5)
    up = detect_trends(worse, ticks(previous))
    down = detect_trends(better, ticks(make_state(-20, camp_load=90, congestion=80)))
    assert up.direction == "worsening"
    assert down.direction == "improving"


def test_gaps_detect_ambulance_and_medicine():
    gaps = detect_gaps(make_state(ambulances=(1, 4), medicine=18, camp_load=90))
    resources = {item.resource for item in gaps}
    assert "ambulances" in resources
    assert "medicine_stock" in resources
    assert "medical_capacity" in resources


def test_rate_positive_when_deteriorating():
    start = make_state(-60, camp_load=20, congestion=10)
    end = make_state(0, camp_load=90, congestion=80)
    rate = overall_rate_per_hour(end, ticks(start))
    assert rate is not None and rate > 0


def test_freshness_stale():
    current = make_state(0)
    analyzed = utc(0) + timedelta(hours=3)
    report = assess_freshness(current, ticks(make_state(-20)), analyzed)
    assert report.grade == "stale"
    assert report.current_age_minutes >= 120


def test_correlation_multi_domain():
    state = make_state(
        delay=50,
        concentration=90,
        camp_load=95,
        ambulances=(0, 6),
        congestion=90,
        rain=25,
        water=20,
        sanitation=20,
        halt=20,
    )
    scores, _ = score_state(state)
    findings = detect_correlations(state, scores)
    assert any(item.id == "multi_domain_emergency" for item in findings)
