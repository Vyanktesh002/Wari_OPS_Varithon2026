"""Deterministic readiness and operational risk scoring. No ML, no LLM."""

from __future__ import annotations

from typing import Any

from config import clamp, get_config, interpolate_curve, status_for_score
from schemas import DomainScore, Incident, WariState


def _round(value: float) -> int:
    return int(clamp(round(value)))


def _open_incidents(state: WariState) -> list[Incident]:
    return [item for item in state.incidents if item.status != "resolved"]


def palkhi_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    return interpolate_curve(state.palkhi.delay_minutes, cfg["palkhi"]["delay_curve"])


def dindi_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    dcfg = cfg["dindi"]
    delay = interpolate_curve(state.dindi.delay_minutes, dcfg["delay_curve"])
    issues = min(40.0, state.dindi.open_issues * dcfg["issue_points"])
    return clamp(
        dcfg["concentration_weight"] * state.dindi.concentration
        + (1 - dcfg["concentration_weight"]) * delay
        + issues * 0.25
    )


def medical_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    mcfg = cfg["medical"]
    med = state.medical
    if med.ambulance_required <= 0:
        ambulance = 0.0 if med.ambulance_available > 0 else 15.0
    else:
        coverage = med.ambulance_available / med.ambulance_required
        ambulance = clamp((1 - coverage) * 100)
    medicine = 100 - med.medicine_stock_pct
    referrals = min(100.0, med.emergency_referrals * mcfg["referral_scale"])
    return clamp(
        mcfg["load_weight"] * med.camp_load_pct
        + mcfg["ambulance_weight"] * ambulance
        + mcfg["medicine_weight"] * medicine
        + mcfg["referral_weight"] * referrals
    )


def traffic_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    tcfg = cfg["traffic"]
    blocked = tcfg["block_bonus"] if state.traffic.route_blocked else 0
    incidents = min(30.0, state.traffic.open_incidents * tcfg["incident_points"])
    return clamp(state.traffic.congestion_level * 0.7 + blocked + incidents)


def municipal_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    mcfg = cfg["municipal"]
    mun = state.municipal
    water = 100 - mun.water_readiness_pct
    shelter = mun.shelter_occupancy_pct
    power = 0.0 if mun.electricity_ok else 100.0
    return clamp(
        mcfg["water_weight"] * water
        + mcfg["shelter_weight"] * shelter
        + mcfg["electricity_weight"] * power
    )


def sanitation_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    san = state.sanitation
    return clamp(100 - (san.facility_readiness_pct * 0.6 + san.cleanliness_pct * 0.4))


def weather_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    wcfg = cfg["weather"]
    rain = interpolate_curve(state.weather.rainfall_mm, wcfg["rain_curve"])
    hazard = wcfg["hazard_bonus"] if state.weather.route_hazard else 0
    return clamp(rain + hazard)


def halt_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    _ = cfg
    return clamp(100 - state.halt.readiness_pct)


def incident_pressure(state: WariState, cfg: dict[str, Any]) -> float:
    points = cfg["incidents"]["severity_points"]
    total = sum(points.get(item.severity, 0) for item in _open_incidents(state))
    return clamp(min(cfg["incidents"]["cap"], total) * (100 / cfg["incidents"]["cap"]))


PRESSURE_FNS = {
    "palkhi": palkhi_pressure,
    "dindi": dindi_pressure,
    "medical": medical_pressure,
    "traffic": traffic_pressure,
    "municipal": municipal_pressure,
    "sanitation": sanitation_pressure,
    "weather": weather_pressure,
    "halt": halt_pressure,
    "incidents": incident_pressure,
}

DOMAIN_LABELS = {
    "palkhi": "Palkhi schedule",
    "dindi": "Dindi / crowd",
    "medical": "Medical",
    "traffic": "Traffic / police",
    "municipal": "Municipal / infrastructure",
    "sanitation": "Sanitation",
    "weather": "Weather / route",
    "halt": "Halt readiness",
    "incidents": "Active incidents",
}


def domain_pressures(state: WariState, cfg: dict[str, Any] | None = None) -> dict[str, float]:
    cfg = cfg or get_config()
    return {name: fn(state, cfg) for name, fn in PRESSURE_FNS.items()}


def domain_scores_from_pressures(pressures: dict[str, float]) -> list[DomainScore]:
    scores: list[DomainScore] = []
    for name, pressure in pressures.items():
        p = _round(pressure)
        scores.append(
            DomainScore(
                domain=name,  # type: ignore[arg-type]
                pressure=p,
                readiness=_round(100 - p),
                label=DOMAIN_LABELS[name],
            )
        )
    return scores


def weighted_operational_risk(pressures: dict[str, float], cfg: dict[str, Any]) -> float:
    weights = cfg["domain_weights"]
    weighted = sum(pressures[name] * weight for name, weight in weights.items())
    core = [pressures[name] for name in weights]
    peak = max(core) if core else 0.0
    mix = cfg["risk_mix"]
    combined = mix["weighted_average"] * weighted + mix["max_domain"] * peak
    incident_boost = pressures.get("incidents", 0) * 0.15
    return clamp(combined + incident_boost)


def score_state(state: WariState, cfg: dict[str, Any] | None = None) -> tuple[list[DomainScore], int]:
    cfg = cfg or get_config()
    pressures = domain_pressures(state, cfg)
    scores = domain_scores_from_pressures(pressures)
    risk = _round(weighted_operational_risk(pressures, cfg))
    return scores, risk


def apply_risk_boost(base_risk: int, boost: int, cap: int = 100) -> int:
    return int(clamp(base_risk + boost, 0, cap))


def overall_readiness(scores: list[DomainScore], cfg: dict[str, Any] | None = None) -> int:
    cfg = cfg or get_config()
    weights = cfg["domain_weights"]
    total = 0.0
    weight_sum = 0.0
    by_domain = {item.domain: item.readiness for item in scores}
    for name, weight in weights.items():
        total += by_domain.get(name, 100) * weight
        weight_sum += weight
    if weight_sum == 0:
        return 100
    return _round(total / weight_sum)


def risk_status(score: int, cfg: dict[str, Any] | None = None) -> str:
    return status_for_score(score, cfg)
