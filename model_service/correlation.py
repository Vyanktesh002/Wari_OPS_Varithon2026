"""Cross-domain correlation detection. Adds explainable risk boosts only."""

from __future__ import annotations

from typing import Any

from config import get_config
from schemas import CorrelationFinding, DomainScore, WariState
from scoring import medical_pressure


def detect_correlations(
    state: WariState,
    scores: list[DomainScore],
    cfg: dict[str, Any] | None = None,
) -> list[CorrelationFinding]:
    cfg = cfg or get_config()
    ccfg = cfg["correlation"]
    by_name = {item.domain: item.pressure for item in scores}
    findings: list[CorrelationFinding] = []

    if (
        by_name.get("dindi", 0) >= ccfg["crowd_medical_crowd"]
        and by_name.get("medical", 0) >= ccfg["crowd_medical_load"]
    ):
        findings.append(
            CorrelationFinding(
                id="crowd_medical_stress",
                title="Crowd pressure coinciding with medical load",
                domains=["dindi", "medical"],
                severity="high",
                boost=ccfg["crowd_medical_boost"],
                rationale="High Dindi/crowd concentration is occurring with high medical camp load.",
            )
        )

    if (
        by_name.get("weather", 0) >= ccfg["weather_movement_rain_pressure"]
        and by_name.get("traffic", 0) >= ccfg["weather_movement_traffic"]
        and state.palkhi.delay_minutes >= ccfg["weather_movement_delay"]
    ):
        findings.append(
            CorrelationFinding(
                id="weather_movement_disruption",
                title="Weather, traffic and Palkhi delay interacting",
                domains=["weather", "traffic", "palkhi"],
                severity="high",
                boost=ccfg["weather_movement_boost"],
                rationale="Rain/route hazard, congestion and schedule delay are rising together.",
            )
        )

    ambulance_pressure = medical_pressure(state, cfg)
    if (
        ambulance_pressure >= ccfg["medical_access_ambulance_pressure"]
        and by_name.get("traffic", 0) >= ccfg["medical_access_traffic"]
        and (state.medical.ambulance_required > state.medical.ambulance_available)
    ):
        findings.append(
            CorrelationFinding(
                id="medical_access_blocked",
                title="Ambulance gap under congested access",
                domains=["medical", "traffic"],
                severity="critical",
                boost=ccfg["medical_access_boost"],
                rationale="Ambulance shortfall coincides with high congestion, limiting casualty movement.",
            )
        )

    if (
        state.halt.readiness_pct < ccfg["halt_arrival_readiness"]
        and state.palkhi.delay_minutes <= ccfg["halt_arrival_delay_max"]
        and state.palkhi.on_route
    ):
        findings.append(
            CorrelationFinding(
                id="halt_unready_arrival",
                title="Halt not ready as Palkhi remains on schedule window",
                domains=["halt", "palkhi"],
                severity="medium",
                boost=ccfg["halt_arrival_boost"],
                rationale="Halt readiness is low while the Palkhi is still within a near-arrival delay window.",
            )
        )

    if (
        by_name.get("dindi", 0) >= ccfg["public_health_crowd"]
        and state.municipal.water_readiness_pct <= ccfg["public_health_water"]
        and state.sanitation.facility_readiness_pct <= ccfg["public_health_sanitation"]
    ):
        findings.append(
            CorrelationFinding(
                id="public_health_cluster",
                title="Crowd with water and sanitation stress",
                domains=["dindi", "municipal", "sanitation"],
                severity="high",
                boost=ccfg["public_health_boost"],
                rationale="Crowd concentration overlaps with weak water and sanitation readiness.",
            )
        )

    high_domains = [
        name
        for name, pressure in by_name.items()
        if name != "incidents" and pressure >= 50
    ]
    if len(high_domains) >= ccfg["multi_domain_min_high"]:
        findings.append(
            CorrelationFinding(
                id="multi_domain_emergency",
                title="Multi-domain operational emergency",
                domains=high_domains,  # type: ignore[arg-type]
                severity="critical",
                boost=ccfg["multi_domain_boost"],
                rationale=f"{len(high_domains)} domains are at HIGH or worse at the same time.",
            )
        )

    cap = ccfg["boost_cap"]
    used = 0
    capped: list[CorrelationFinding] = []
    for item in findings:
        remaining = max(0, cap - used)
        boost = min(item.boost, remaining)
        used += boost
        capped.append(item.model_copy(update={"boost": boost}))
        if used >= cap:
            break
    return capped


def correlation_boost(findings: list[CorrelationFinding]) -> int:
    return sum(item.boost for item in findings)
