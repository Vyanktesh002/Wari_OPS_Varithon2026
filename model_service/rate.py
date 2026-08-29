"""Deterioration / improvement rate from history ticks."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from config import get_config
from schemas import EmergingRisk, HistoryTick, WariState
from scoring import domain_pressures, weighted_operational_risk


def hours_between(later: datetime, earlier: datetime) -> float:
    seconds = (later - earlier).total_seconds()
    return max(seconds / 3600.0, 1 / 60)


def overall_rate_per_hour(
    current: WariState,
    history: list[HistoryTick],
    cfg: dict[str, Any] | None = None,
) -> float | None:
    cfg = cfg or get_config()
    if not history:
        return None
    start = history[0].state
    hours = hours_between(current.timestamp, start.timestamp)
    start_risk = weighted_operational_risk(domain_pressures(start, cfg), cfg)
    end_risk = weighted_operational_risk(domain_pressures(current, cfg), cfg)
    return round((end_risk - start_risk) / hours, 2)


def domain_rates(
    current: WariState,
    history: list[HistoryTick],
    cfg: dict[str, Any] | None = None,
) -> dict[str, float]:
    cfg = cfg or get_config()
    if not history:
        return {}
    start = history[0].state
    hours = hours_between(current.timestamp, start.timestamp)
    start_p = domain_pressures(start, cfg)
    end_p = domain_pressures(current, cfg)
    return {name: round((end_p[name] - start_p[name]) / hours, 2) for name in end_p}


def emerging_from_rate(
    current: WariState,
    history: list[HistoryTick],
    cfg: dict[str, Any] | None = None,
) -> tuple[float | None, list[EmergingRisk]]:
    cfg = cfg or get_config()
    rapid = cfg["rate"]["rapid_per_hour"]
    overall = overall_rate_per_hour(current, history, cfg)
    rates = domain_rates(current, history, cfg)
    risks: list[EmergingRisk] = []
    for name, rate in sorted(rates.items(), key=lambda item: item[1], reverse=True):
        if rate >= rapid:
            risks.append(
                EmergingRisk(
                    id=f"rate_{name}",
                    title=f"{name} deteriorating rapidly",
                    domains=[name],  # type: ignore[list-item]
                    severity="high" if rate < rapid * 1.5 else "critical",
                    rationale=f"{name} pressure is rising at about {rate:.1f} points per hour.",
                    rate_per_hour=rate,
                )
            )
    if overall is not None and overall >= rapid and not any(item.id == "rate_overall" for item in risks):
        risks.insert(
            0,
            EmergingRisk(
                id="rate_overall",
                title="Overall operational risk rising rapidly",
                domains=["incidents"],
                severity="high",
                rationale=f"Composite risk is rising at about {overall:.1f} points per hour.",
                rate_per_hour=overall,
            ),
        )
    return overall, risks
