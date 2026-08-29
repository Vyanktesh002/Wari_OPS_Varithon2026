"""Resource-gap detection from current operational state."""

from __future__ import annotations

from typing import Any

from config import get_config
from schemas import ResourceGap, Severity, WariState


def _sev(level: str) -> Severity:
    return level  # type: ignore[return-value]


def detect_gaps(state: WariState, cfg: dict[str, Any] | None = None) -> list[ResourceGap]:
    cfg = cfg or get_config()
    gcfg = cfg["gaps"]
    gaps: list[ResourceGap] = []
    med = state.medical

    shortfall = med.ambulance_required - med.ambulance_available
    if shortfall >= gcfg["ambulance_shortfall_min"]:
        severity = "critical" if shortfall >= 3 or med.ambulance_available == 0 else "high"
        gaps.append(
            ResourceGap(
                id="gap_ambulances",
                domain="medical",
                resource="ambulances",
                severity=_sev(severity),
                shortfall=f"{shortfall} vehicle(s)",
                detail=(
                    f"{med.ambulance_available} available against {med.ambulance_required} required."
                ),
            )
        )

    if med.medicine_stock_pct <= gcfg["medicine_low_pct"]:
        severity = "critical" if med.medicine_stock_pct <= cfg["medical"]["critical_medicine_pct"] else "high"
        gaps.append(
            ResourceGap(
                id="gap_medicine",
                domain="medical",
                resource="medicine_stock",
                severity=_sev(severity),
                shortfall=f"{int(round(100 - med.medicine_stock_pct))}% below full",
                detail=f"Medicine stock is at {med.medicine_stock_pct:.0f}%.",
            )
        )

    if med.camp_load_pct >= gcfg["camp_load_pct"]:
        gaps.append(
            ResourceGap(
                id="gap_medical_capacity",
                domain="medical",
                resource="medical_capacity",
                severity=_sev("critical" if med.camp_load_pct >= 95 else "high"),
                shortfall=f"camp load {med.camp_load_pct:.0f}%",
                detail="Medical camp load is at or above the capacity-gap threshold.",
            )
        )

    if state.municipal.shelter_occupancy_pct >= gcfg["shelter_occupancy_pct"]:
        gaps.append(
            ResourceGap(
                id="gap_shelter",
                domain="municipal",
                resource="temporary_shelter",
                severity=_sev("high"),
                shortfall=f"occupancy {state.municipal.shelter_occupancy_pct:.0f}%",
                detail="Temporary shelter occupancy is near or at capacity.",
            )
        )

    if state.municipal.water_readiness_pct <= gcfg["water_readiness"]:
        gaps.append(
            ResourceGap(
                id="gap_water",
                domain="municipal",
                resource="water",
                severity=_sev("high" if state.municipal.water_readiness_pct <= 20 else "medium"),
                shortfall=f"readiness {state.municipal.water_readiness_pct:.0f}%",
                detail="Water readiness is below the acceptable threshold.",
            )
        )

    if not state.municipal.electricity_ok:
        gaps.append(
            ResourceGap(
                id="gap_electricity",
                domain="municipal",
                resource="electricity",
                severity=_sev("high"),
                shortfall="power not confirmed",
                detail="Electricity is reported as not OK.",
            )
        )

    if state.sanitation.facility_readiness_pct <= gcfg["sanitation_readiness"]:
        gaps.append(
            ResourceGap(
                id="gap_sanitation",
                domain="sanitation",
                resource="sanitation_facilities",
                severity=_sev("medium"),
                shortfall=f"readiness {state.sanitation.facility_readiness_pct:.0f}%",
                detail="Sanitation facility readiness is below the acceptable threshold.",
            )
        )

    return gaps
