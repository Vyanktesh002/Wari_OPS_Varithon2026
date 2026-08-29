from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from schemas import (
    AnalyzeOptions,
    AnalyzeRequest,
    DindiState,
    HaltState,
    HistoryTick,
    Incident,
    MedicalState,
    MunicipalState,
    PalkhiState,
    SanitationState,
    TrafficState,
    WariState,
    WeatherState,
)


def utc(offset_minutes: int = 0) -> datetime:
    return datetime(2026, 6, 20, 10, 0, tzinfo=timezone.utc) + timedelta(minutes=offset_minutes)


def make_state(
    minutes: int = 0,
    *,
    delay: int = 0,
    concentration: float = 20,
    camp_load: float = 30,
    ambulances: tuple[int, int] = (4, 4),
    medicine: float = 90,
    congestion: float = 20,
    blocked: bool = False,
    rain: float = 0,
    water: float = 90,
    shelter: float = 20,
    electricity: bool = True,
    sanitation: float = 90,
    halt: float = 90,
    referrals: int = 0,
    incidents: list[Incident] | None = None,
    dindi_delay: int = 0,
    open_issues: int = 0,
) -> WariState:
    return WariState(
        timestamp=utc(minutes),
        palkhi=PalkhiState(delay_minutes=delay),
        dindi=DindiState(
            concentration=concentration,
            headcount=800,
            delay_minutes=dindi_delay,
            open_issues=open_issues,
        ),
        medical=MedicalState(
            camp_load_pct=camp_load,
            ambulance_available=ambulances[0],
            ambulance_required=ambulances[1],
            medicine_stock_pct=medicine,
            emergency_referrals=referrals,
        ),
        traffic=TrafficState(congestion_level=congestion, route_blocked=blocked, open_incidents=0),
        municipal=MunicipalState(
            water_readiness_pct=water,
            shelter_occupancy_pct=shelter,
            electricity_ok=electricity,
        ),
        sanitation=SanitationState(facility_readiness_pct=sanitation, cleanliness_pct=sanitation),
        weather=WeatherState(rainfall_mm=rain, condition="rain" if rain else "clear"),
        halt=HaltState(readiness_pct=halt),
        incidents=incidents or [],
    )


def ticks(*states: WariState) -> list[HistoryTick]:
    return [HistoryTick(timestamp=state.timestamp, state=state) for state in states]


def analyze_payload(
    current: WariState,
    history: list[WariState] | None = None,
    **kwargs,
) -> AnalyzeRequest:
    return AnalyzeRequest(
        location_id=kwargs.get("location_id", "loc-jejuri"),
        location_name=kwargs.get("location_name", "Jejuri"),
        analyzed_at=kwargs.get("analyzed_at", utc(current_offset(current))),
        current=current,
        history=ticks(*(history or [])),
        previous_fingerprint=kwargs.get("previous_fingerprint"),
        previous_risk_score=kwargs.get("previous_risk_score"),
        previous_situation_class=kwargs.get("previous_situation_class"),
        options=kwargs.get("options") or AnalyzeOptions(),
    )


def current_offset(state: WariState) -> int:
    base = datetime(2026, 6, 20, 10, 0, tzinfo=timezone.utc)
    return int((state.timestamp - base).total_seconds() // 60)
