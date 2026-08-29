"""Administrator intelligence: priorities, headline, fingerprint, suppression."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from config import get_config
from correlation import correlation_boost, detect_correlations
from freshness import assess_confidence, assess_freshness
from gaps import detect_gaps
from rate import emerging_from_rate
from schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    DomainScore,
    EmergingRisk,
    PriorityAction,
    ReadinessReport,
    ResourceGap,
    WariState,
)
from scoring import apply_risk_boost, overall_readiness, risk_status, score_state
from summarize import apply_phrasing, deterministic_summary
from trends import detect_trends


def _now(requested: datetime | None) -> datetime:
    if requested is not None:
        return requested
    return datetime.now(timezone.utc)


def _band(pressure: int) -> str:
    if pressure <= 24:
        return "n"
    if pressure <= 49:
        return "e"
    if pressure <= 74:
        return "h"
    return "c"


def compute_fingerprint(
    status: str,
    situation_class: str,
    scores: list[DomainScore],
    gaps: list[ResourceGap],
    correlation_ids: list[str],
    emerging_ids: list[str],
) -> str:
    payload = {
        "status": status,
        "situation_class": situation_class,
        "bands": {item.domain: _band(item.pressure) for item in scores},
        "gaps": sorted(item.id for item in gaps),
        "corr": sorted(correlation_ids),
        "emerge": sorted(emerging_ids),
    }
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def classify_situation(
    risk_score: int,
    change_direction: str,
    newly_critical: list[str],
    resolved_domains: list[str],
    rate_per_hour: float | None,
    current: WariState,
    previous_risk: int | None,
    cfg: dict[str, Any],
    peak_history_risk: int | None = None,
) -> str:
    rapid = cfg["rate"]["rapid_per_hour"]
    improving = cfg["rate"]["improving_per_hour"]
    open_incidents = [item for item in current.incidents if item.status != "resolved"]
    all_incidents_resolved = bool(current.incidents) and not open_incidents
    peak = peak_history_risk if peak_history_risk is not None else previous_risk

    if newly_critical or (risk_score >= 75 and (previous_risk is None or previous_risk < 75)):
        if previous_risk is not None and previous_risk < 75:
            return "newly_critical"
        if newly_critical:
            return "newly_critical"

    if risk_score < 25 and peak is not None and peak >= 50:
        if resolved_domains or all_incidents_resolved:
            return "resolved"

    if rate_per_hour is not None and rate_per_hour >= rapid:
        return "rapidly_worsening"
    if change_direction == "worsening" and rate_per_hour is not None and rate_per_hour >= rapid * 0.6:
        return "rapidly_worsening"

    if change_direction == "improving" or (rate_per_hour is not None and rate_per_hour <= improving):
        return "improving"

    if risk_score >= 50 and change_direction in {"stable", "mixed"}:
        return "stable_high_pressure"

    return "stable"


def _severity_rank(severity: str) -> int:
    return {"low": 1, "medium": 2, "high": 3, "critical": 4}.get(severity, 0)


def build_priorities(
    location: str,
    gaps: list[ResourceGap],
    correlations: list,
    emerging: list,
    scores: list[DomainScore],
    current: WariState,
    max_actions: int,
) -> list[PriorityAction]:
    candidates: list[tuple[int, PriorityAction]] = []

    authority = {
        "medical": "Doctor Dindi / Medical Authority",
        "traffic": "Police Authority",
        "dindi": "Dindi Coordinator",
        "palkhi": "Wari Supervisor",
        "municipal": "Municipal / Infrastructure Authority",
        "sanitation": "Sanitation / Nirmal Wari Authority",
        "weather": "Wari Supervisor",
        "halt": "Municipal / Infrastructure Authority",
        "incidents": "Wari Supervisor",
    }

    for gap in gaps:
        weight = 40 + _severity_rank(gap.severity) * 10
        candidates.append(
            (
                weight,
                PriorityAction(
                    rank=0,
                    action=f"Close {gap.resource.replace('_', ' ')} gap at {location}",
                    authority=authority[gap.domain],
                    domain=gap.domain,
                    severity=gap.severity,
                    why=gap.detail,
                ),
            )
        )

    for finding in correlations:
        weight = 35 + _severity_rank(finding.severity) * 10
        candidates.append(
            (
                weight,
                PriorityAction(
                    rank=0,
                    action=f"Coordinate a cross-domain response: {finding.title}",
                    authority="Wari Supervisor",
                    domain=finding.domains[0],
                    severity=finding.severity,
                    why=finding.rationale,
                ),
            )
        )

    for risk in emerging:
        weight = 30 + _severity_rank(risk.severity) * 10
        candidates.append(
            (
                weight,
                PriorityAction(
                    rank=0,
                    action=f"Intercept deteriorating {risk.domains[0]} conditions at {location}",
                    authority=authority.get(risk.domains[0], "Wari Supervisor"),
                    domain=risk.domains[0],
                    severity=risk.severity,
                    why=risk.rationale,
                ),
            )
        )

    for incident in current.incidents:
        if incident.status == "resolved":
            continue
        if incident.severity in {"high", "critical"}:
            weight = 32 + _severity_rank(incident.severity) * 10
            candidates.append(
                (
                    weight,
                    PriorityAction(
                        rank=0,
                        action=f"Drive incident {incident.id} to resolution",
                        authority=incident.authority or "Wari Supervisor",
                        domain="incidents",
                        severity=incident.severity,
                        why=incident.description or incident.category,
                    ),
                )
            )

    hot = [item for item in scores if item.pressure >= 75]
    for item in hot:
        weight = 20 + item.pressure // 5
        candidates.append(
            (
                weight,
                PriorityAction(
                    rank=0,
                    action=f"Stand up extra coverage for {item.label}",
                    authority=authority.get(item.domain, "Wari Supervisor"),
                    domain=item.domain,
                    severity="critical",
                    why=f"{item.label} pressure is {item.pressure}.",
                ),
            )
        )

    candidates.sort(key=lambda pair: pair[0], reverse=True)
    seen: set[str] = set()
    ranked: list[PriorityAction] = []
    for _, action in candidates:
        key = action.action
        if key in seen:
            continue
        seen.add(key)
        ranked.append(action.model_copy(update={"rank": len(ranked) + 1}))
        if len(ranked) >= max_actions:
            break

    if not ranked:
        ranked.append(
            PriorityAction(
                rank=1,
                action=f"Continue routine monitoring at {location}",
                authority="Wari Supervisor",
                domain="incidents",
                severity="low",
                why="No high-priority gaps or deteriorating domains.",
            )
        )
    return ranked


def key_factors_from(scores: list[DomainScore], gaps: list[ResourceGap], correlations: list) -> list[str]:
    factors: list[str] = []
    for item in sorted(scores, key=lambda row: row.pressure, reverse=True):
        if item.pressure >= 50:
            factors.append(f"{item.label} pressure {item.pressure}")
        if len(factors) >= 4:
            break
    for gap in gaps[:2]:
        factors.append(f"{gap.resource} gap ({gap.severity})")
    for finding in correlations[:2]:
        factors.append(finding.title)
    # de-dupe preserving order
    out: list[str] = []
    seen: set[str] = set()
    for item in factors:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out[:6]


def should_suppress(
    fingerprint: str,
    request: AnalyzeRequest,
    risk_score: int,
    situation_class: str,
    cfg: dict[str, Any],
) -> tuple[bool, str | None]:
    if not request.previous_fingerprint:
        return False, None
    if fingerprint != request.previous_fingerprint:
        return False, None
    scfg = cfg["suppression"]
    if request.previous_risk_score is not None:
        if abs(risk_score - request.previous_risk_score) > scfg["risk_delta_max"]:
            return False, None
    if scfg["require_same_situation_class"] and request.previous_situation_class:
        if request.previous_situation_class != situation_class:
            return False, None
    return True, "Identical operational signature; no meaningful change since last analysis."


def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    cfg = get_config()
    analyzed_at = _now(request.analyzed_at)
    location = request.location_name or request.location_id

    scores, base_risk = score_state(request.current, cfg)
    change = detect_trends(request.current, request.history, cfg)
    correlations = detect_correlations(request.current, scores, cfg)
    risk_score = apply_risk_boost(base_risk, correlation_boost(correlations))
    status = risk_status(risk_score, cfg)

    gaps = detect_gaps(request.current, cfg)
    rate_per_hour, rate_risks = emerging_from_rate(request.current, request.history, cfg)

    previous_risk = request.previous_risk_score
    if previous_risk is None and request.history:
        _, previous_risk = score_state(request.history[-1].state, cfg)
    peak_history_risk = previous_risk
    if request.history:
        history_scores = [score_state(tick.state, cfg)[1] for tick in request.history]
        peak_history_risk = max(history_scores + ([previous_risk] if previous_risk is not None else []))

    situation_class = classify_situation(
        risk_score,
        change.direction,
        list(change.newly_critical_domains),
        list(change.resolved_domains),
        rate_per_hour,
        request.current,
        previous_risk,
        cfg,
        peak_history_risk=peak_history_risk,
    )

    freshness = assess_freshness(request.current, request.history, analyzed_at, cfg)
    confidence = assess_confidence(request.current, request.history, freshness, cfg)

    emerging = list(rate_risks)
    seen_ids = {item.id for item in emerging}
    for finding in correlations:
        eid = f"corr_{finding.id}"
        if eid in seen_ids:
            continue
        emerging.append(
            EmergingRisk(
                id=eid,
                title=finding.title,
                domains=finding.domains,
                severity=finding.severity,
                rationale=finding.rationale,
            )
        )

    max_actions = min(request.options.max_priorities, cfg["priority"]["max_actions"])
    priorities = build_priorities(
        location, gaps, correlations, rate_risks, scores, request.current, max_actions
    )
    factors = key_factors_from(scores, gaps, correlations)
    headline = f"{location} — {status}"
    if factors:
        headline = f"{headline}: {factors[0]}"

    fingerprint = compute_fingerprint(
        status,
        situation_class,
        scores,
        gaps,
        [item.id for item in correlations],
        [item.id for item in emerging],
    )
    suppressed, reason = should_suppress(fingerprint, request, risk_score, situation_class, cfg)
    if suppressed:
        priorities = [item.model_copy(update={"suppressed": True}) for item in priorities]

    summary = deterministic_summary(
        location,
        status,
        risk_score,
        situation_class,
        change.summary,
        factors,
        gaps,
        [item.title for item in emerging],
        [item.action for item in priorities if not item.suppressed],
    )

    response = AnalyzeResponse(
        location_id=request.location_id,
        location_name=request.location_name,
        analyzed_at=analyzed_at,
        model_version=cfg["model_version"],
        risk_score=risk_score,
        status=status,  # type: ignore[arg-type]
        headline=headline,
        key_factors=factors,
        change=change,
        situation_summary=summary,
        situation_class=situation_class,  # type: ignore[arg-type]
        resource_gaps=gaps,
        emerging_risks=emerging,
        priority_actions=priorities,
        correlations=correlations,
        data_freshness=freshness,
        confidence=confidence,
        readiness=ReadinessReport(overall=overall_readiness(scores, cfg), domains=scores),
        domain_scores=scores,
        suppressed=suppressed,
        suppression_reason=reason,
        fingerprint=fingerprint,
        deterministic=True,
        phrasing_source="deterministic",
    )
    return apply_phrasing(response, request.options.use_llm_phrasing)
