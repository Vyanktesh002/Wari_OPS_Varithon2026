"""Load deterministic scoring thresholds from config.json."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

CONFIG_PATH = Path(__file__).resolve().parent / "config.json"


@lru_cache(maxsize=1)
def get_config() -> dict[str, Any]:
    with CONFIG_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def interpolate_curve(value: float, curve: list[list[float]]) -> float:
    """Piecewise-linear map of x -> y for [[x, y], ...] sorted by x."""
    if not curve:
        return 0.0
    if value <= curve[0][0]:
        return float(curve[0][1])
    if value >= curve[-1][0]:
        return float(curve[-1][1])
    for left, right in zip(curve, curve[1:]):
        x0, y0 = left
        x1, y1 = right
        if x0 <= value <= x1:
            if x1 == x0:
                return float(y1)
            ratio = (value - x0) / (x1 - x0)
            return float(y0 + ratio * (y1 - y0))
    return float(curve[-1][1])


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def status_for_score(score: int, cfg: dict[str, Any] | None = None) -> str:
    bands = (cfg or get_config())["status_bands"]
    for name, (lo, hi) in bands.items():
        if lo <= score <= hi:
            return name
    return "CRITICAL"
