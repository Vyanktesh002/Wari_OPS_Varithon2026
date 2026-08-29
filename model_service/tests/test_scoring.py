from scoring import domain_pressures, score_state
from tests.conftest import make_state


def test_normal_low_pressure():
    scores, risk = score_state(make_state())
    assert risk < 25
    by_name = {item.domain: item for item in scores}
    assert by_name["medical"].readiness > by_name["medical"].pressure


def test_medical_overload_raises_risk():
    quiet, quiet_risk = score_state(make_state())
    hot, hot_risk = score_state(make_state(camp_load=95, ambulances=(0, 5), medicine=10, referrals=4))
    assert hot_risk > quiet_risk
    medical = next(item for item in hot if item.domain == "medical")
    assert medical.pressure >= 70


def test_palkhi_delay_curve():
    low = domain_pressures(make_state(delay=5))["palkhi"]
    high = domain_pressures(make_state(delay=80))["palkhi"]
    assert high > low
    assert high >= 70
