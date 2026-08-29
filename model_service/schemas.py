"""Explicit request/response contracts for POST /model/analyze."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

IncidentStatus = Literal["reported", "acknowledged", "in_progress", "resolved"]
Severity = Literal["low", "medium", "high", "critical"]
RiskStatus = Literal["NORMAL", "ELEVATED", "HIGH", "CRITICAL"]
SituationClass = Literal[
    "stable",
    "stable_high_pressure",
    "rapidly_worsening",
    "improving",
    "newly_critical",
    "resolved",
]
ChangeDirection = Literal["stable", "worsening", "improving", "mixed"]
PhrasingSource = Literal["deterministic", "llm"]
DomainName = Literal[
    "palkhi",
    "dindi",
    "medical",
    "traffic",
    "municipal",
    "sanitation",
    "weather",
    "halt",
    "incidents",
]


class PalkhiState(BaseModel):
    delay_minutes: int = Field(0, ge=0, description="Minutes behind published Palkhi schedule.")
    eta_minutes: int | None = Field(None, ge=0)
    on_route: bool = True


class DindiState(BaseModel):
    concentration: float = Field(0, ge=0, le=100, description="Crowd/Dindi concentration 0-100.")
    headcount: int = Field(0, ge=0)
    delay_minutes: int = Field(0, ge=0)
    open_issues: int = Field(0, ge=0)


class MedicalState(BaseModel):
    camp_load_pct: float = Field(0, ge=0, le=100)
    ambulance_available: int = Field(0, ge=0)
    ambulance_required: int = Field(0, ge=0)
    medicine_stock_pct: float = Field(100, ge=0, le=100)
    icu_available: int = Field(0, ge=0)
    emergency_referrals: int = Field(0, ge=0)


class TrafficState(BaseModel):
    congestion_level: float = Field(0, ge=0, le=100)
    route_blocked: bool = False
    open_incidents: int = Field(0, ge=0)


class MunicipalState(BaseModel):
    water_readiness_pct: float = Field(100, ge=0, le=100)
    shelter_occupancy_pct: float = Field(0, ge=0, le=100)
    electricity_ok: bool = True


class SanitationState(BaseModel):
    facility_readiness_pct: float = Field(100, ge=0, le=100)
    cleanliness_pct: float = Field(100, ge=0, le=100)


class WeatherState(BaseModel):
    rainfall_mm: float = Field(0, ge=0)
    condition: str = "clear"
    route_hazard: bool = False


class HaltState(BaseModel):
    readiness_pct: float = Field(100, ge=0, le=100)


class Incident(BaseModel):
    id: str
    category: str
    severity: Severity = "medium"
    status: IncidentStatus = "reported"
    description: str = ""
    authority: str = ""
    timestamp: datetime | None = None


class WariState(BaseModel):
    """One operational snapshot for a location."""

    timestamp: datetime
    palkhi: PalkhiState = Field(default_factory=PalkhiState)
    dindi: DindiState = Field(default_factory=DindiState)
    medical: MedicalState = Field(default_factory=MedicalState)
    traffic: TrafficState = Field(default_factory=TrafficState)
    municipal: MunicipalState = Field(default_factory=MunicipalState)
    sanitation: SanitationState = Field(default_factory=SanitationState)
    weather: WeatherState = Field(default_factory=WeatherState)
    halt: HaltState = Field(default_factory=HaltState)
    incidents: list[Incident] = Field(default_factory=list)


class HistoryTick(BaseModel):
    """A prior snapshot. Backend should send the last 3–5 ticks, oldest first."""

    timestamp: datetime
    state: WariState


class AnalyzeOptions(BaseModel):
    use_llm_phrasing: bool = Field(
        False,
        description="If true, optionally rephrase the situation summary. Never used for scores.",
    )
    max_priorities: int = Field(5, ge=1, le=10)


class AnalyzeRequest(BaseModel):
    location_id: str = Field(..., min_length=1)
    location_name: str | None = None
    analyzed_at: datetime | None = Field(
        None,
        description="Clock used for freshness. Defaults to UTC now if omitted.",
    )
    current: WariState
    history: list[HistoryTick] = Field(
        default_factory=list,
        description="Recent 3–5 history ticks, oldest first. 0–5 accepted.",
    )
    previous_fingerprint: str | None = Field(
        None,
        description="Fingerprint from the last model response for duplicate suppression.",
    )
    previous_risk_score: int | None = Field(None, ge=0, le=100)
    previous_situation_class: SituationClass | None = None
    options: AnalyzeOptions = Field(default_factory=AnalyzeOptions)

    @field_validator("history")
    @classmethod
    def limit_history(cls, value: list[HistoryTick]) -> list[HistoryTick]:
        if len(value) > 5:
            return value[-5:]
        return value


class DomainScore(BaseModel):
    domain: DomainName
    pressure: int = Field(..., ge=0, le=100, description="0=calm, 100=severe.")
    readiness: int = Field(..., ge=0, le=100, description="0=unready, 100=fully ready.")
    label: str


class DomainChange(BaseModel):
    domain: DomainName
    previous_pressure: int | None = None
    current_pressure: int
    delta: int
    direction: ChangeDirection


class ChangeReport(BaseModel):
    direction: ChangeDirection
    summary: str
    domains: list[DomainChange]
    newly_critical_domains: list[DomainName]
    resolved_domains: list[DomainName]


class ResourceGap(BaseModel):
    id: str
    domain: DomainName
    resource: str
    severity: Severity
    shortfall: str
    detail: str


class EmergingRisk(BaseModel):
    id: str
    title: str
    domains: list[DomainName]
    severity: Severity
    rationale: str
    rate_per_hour: float | None = None


class CorrelationFinding(BaseModel):
    id: str
    title: str
    domains: list[DomainName]
    severity: Severity
    boost: int
    rationale: str


class PriorityAction(BaseModel):
    rank: int
    action: str
    authority: str
    domain: DomainName
    severity: Severity
    why: str
    suppressed: bool = False


class FreshnessReport(BaseModel):
    current_age_minutes: float
    grade: Literal["fresh", "aging", "stale"]
    history_ticks: int
    notes: list[str]


class ConfidenceReport(BaseModel):
    score: float = Field(..., ge=0, le=1)
    grade: Literal["high", "medium", "low"]
    reasons: list[str]


class ReadinessReport(BaseModel):
    overall: int = Field(..., ge=0, le=100)
    domains: list[DomainScore]


class AnalyzeResponse(BaseModel):
    location_id: str
    location_name: str | None
    analyzed_at: datetime
    model_version: str
    risk_score: int = Field(..., ge=0, le=100)
    status: RiskStatus
    headline: str
    key_factors: list[str]
    change: ChangeReport
    situation_summary: str
    situation_class: SituationClass
    resource_gaps: list[ResourceGap]
    emerging_risks: list[EmergingRisk]
    priority_actions: list[PriorityAction]
    correlations: list[CorrelationFinding]
    data_freshness: FreshnessReport
    confidence: ConfidenceReport
    readiness: ReadinessReport
    domain_scores: list[DomainScore]
    suppressed: bool
    suppression_reason: str | None
    fingerprint: str
    deterministic: bool = True
    phrasing_source: PhrasingSource
