"""Trend and change detection across recent history ticks."""

from __future__ import annotations

from typing import Any

from config import get_config
from schemas import ChangeDirection, ChangeReport, DomainChange, DomainName, HistoryTick, WariState
from scoring import domain_pressures


def _direction(delta: int, threshold: int) -> ChangeDirection:
    if delta >= threshold:
        return "worsening"
    if delta <= -threshold:
        return "improving"
    return "stable"


def detect_trends(
    current: WariState,
    history: list[HistoryTick],
    cfg: dict[str, Any] | None = None,
) -> ChangeReport:
    cfg = cfg or get_config()
    threshold = cfg["trends"]["meaningful_delta"]
    strong = cfg["trends"]["strong_delta"]
    current_p = domain_pressures(current, cfg)

    previous_p: dict[str, float] | None = None
    if history:
        previous_p = domain_pressures(history[-1].state, cfg)

    domains: list[DomainChange] = []
    newly_critical: list[DomainName] = []
    resolved: list[DomainName] = []

    for name, current_value in current_p.items():
        prev = previous_p.get(name) if previous_p else None
        current_i = int(round(current_value))
        prev_i = int(round(prev)) if prev is not None else None
        delta = 0 if prev_i is None else current_i - prev_i
        domains.append(
            DomainChange(
                domain=name,  # type: ignore[arg-type]
                previous_pressure=prev_i,
                current_pressure=current_i,
                delta=delta,
                direction=_direction(delta, threshold),
            )
        )
        if prev_i is not None:
            if prev_i < 75 <= current_i:
                newly_critical.append(name)  # type: ignore[arg-type]
            if prev_i >= 50 and current_i < 25:
                resolved.append(name)  # type: ignore[arg-type]

    worsening = sum(1 for item in domains if item.direction == "worsening")
    improving = sum(1 for item in domains if item.direction == "improving")
    net = sum(item.delta for item in domains)

    if previous_p is None:
        direction: ChangeDirection = "stable"
        summary = "No history ticks provided; change cannot be measured."
    elif abs(net) < threshold and worsening == 0 and improving == 0:
        direction = "stable"
        summary = "No meaningful operational change since the last tick."
    elif worsening and improving:
        direction = "mixed"
        summary = "Some domains worsened while others improved."
    elif net >= strong or worsening >= 2:
        direction = "worsening"
        summary = "Operational pressure increased across one or more domains."
    elif net <= -strong or improving >= 2:
        direction = "improving"
        summary = "Operational pressure decreased across one or more domains."
    elif worsening:
        direction = "worsening"
        summary = "At least one domain is worsening."
    elif improving:
        direction = "improving"
        summary = "At least one domain is improving."
    else:
        direction = "stable"
        summary = "Conditions are largely unchanged."

    if newly_critical:
        summary = "One or more domains crossed into critical pressure. " + summary
    if resolved:
        summary = "One or more stressed domains eased. " + summary

    return ChangeReport(
        direction=direction,
        summary=summary,
        domains=domains,
        newly_critical_domains=newly_critical,
        resolved_domains=resolved,
    )
