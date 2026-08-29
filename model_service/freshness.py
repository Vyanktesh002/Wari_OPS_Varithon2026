"""Data freshness and analysis confidence. Independent of risk math."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from config import clamp, get_config
from schemas import ConfidenceReport, FreshnessReport, HistoryTick, WariState


def _age_minutes(now: datetime, then: datetime) -> float:
    if now.tzinfo is None and then.tzinfo is not None:
        now = now.replace(tzinfo=timezone.utc)
    if then.tzinfo is None and now.tzinfo is not None:
        then = then.replace(tzinfo=timezone.utc)
    return max((now - then).total_seconds() / 60.0, 0.0)


def assess_freshness(
    current: WariState,
    history: list[HistoryTick],
    analyzed_at: datetime,
    cfg: dict[str, Any] | None = None,
) -> FreshnessReport:
    cfg = cfg or get_config()
    fcfg = cfg["freshness"]
    age = _age_minutes(analyzed_at, current.timestamp)
    if age <= fcfg["fresh_minutes"]:
        grade = "fresh"
    elif age <= fcfg["aging_minutes"]:
        grade = "aging"
    else:
        grade = "stale"

    notes: list[str] = []
    if grade == "stale":
        notes.append(f"Current snapshot is {age:.0f} minutes old.")
    elif grade == "aging":
        notes.append(f"Current snapshot is {age:.0f} minutes old and may lag the field.")
    else:
        notes.append("Current snapshot is recent.")

    ticks = len(history)
    if ticks < 3:
        notes.append("Fewer than 3 history ticks; trend confidence is reduced.")
    else:
        notes.append(f"{ticks} history ticks available.")

    return FreshnessReport(
        current_age_minutes=round(age, 1),
        grade=grade,  # type: ignore[arg-type]
        history_ticks=ticks,
        notes=notes,
    )


def assess_confidence(
    current: WariState,
    history: list[HistoryTick],
    freshness: FreshnessReport,
    cfg: dict[str, Any] | None = None,
) -> ConfidenceReport:
    cfg = cfg or get_config()
    ccfg = cfg["confidence"]
    score = ccfg["base"]
    reasons: list[str] = ["Deterministic rules applied to the supplied snapshot."]

    if freshness.grade == "aging":
        score -= ccfg["aging_penalty"]
        reasons.append("Data is aging.")
    elif freshness.grade == "stale":
        score -= ccfg["stale_penalty"]
        reasons.append("Data is stale.")

    if len(history) == 0:
        score -= ccfg["no_history_penalty"]
        reasons.append("No history ticks.")
    elif len(history) < 3:
        score -= ccfg["short_history_penalty"]
        reasons.append("Short history window.")

    missing = 0
    if current.medical.ambulance_required == 0 and current.medical.ambulance_available == 0:
        missing += 1
        reasons.append("Ambulance requirement not specified.")
    if current.dindi.headcount == 0 and current.dindi.concentration == 0:
        missing += 1
        reasons.append("Dindi headcount/concentration not populated.")
    score -= missing * ccfg["missing_domain_penalty"]

    score = clamp(score, ccfg["floor"], 1.0)
    if score >= 0.75:
        grade = "high"
    elif score >= 0.55:
        grade = "medium"
    else:
        grade = "low"

    return ConfidenceReport(score=round(score, 2), grade=grade, reasons=reasons)  # type: ignore[arg-type]
