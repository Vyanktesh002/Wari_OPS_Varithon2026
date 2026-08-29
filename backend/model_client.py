"""Server-to-server client for the model service's POST /model/analyze.

Per MODEL_INTEGRATION.md: only the Flask backend talks to the model
service. The browser never calls it directly.
"""
from __future__ import annotations

import os

import requests

MODEL_SERVICE_URL = os.environ.get("MODEL_SERVICE_URL", "http://127.0.0.1:8001")
TIMEOUT_SECONDS = 8


class ModelServiceError(Exception):
    """Raised when the model service is unreachable or returns an error."""


def health() -> bool:
    try:
        resp = requests.get(f"{MODEL_SERVICE_URL}/health", timeout=3)
        return resp.ok
    except requests.RequestException:
        return False


def analyze(
    location_id: str,
    location_name: str | None,
    current_state: dict,
    history_ticks: list[dict],
    previous: dict | None = None,
    max_priorities: int = 5,
) -> dict:
    payload = {
        "location_id": location_id,
        "location_name": location_name,
        "current": current_state,
        "history": history_ticks,
        "previous_fingerprint": (previous or {}).get("fingerprint"),
        "previous_risk_score": (previous or {}).get("risk_score"),
        "previous_situation_class": (previous or {}).get("situation_class"),
        "options": {"use_llm_phrasing": False, "max_priorities": max_priorities},
    }
    try:
        resp = requests.post(f"{MODEL_SERVICE_URL}/model/analyze", json=payload, timeout=TIMEOUT_SECONDS)
    except requests.RequestException as exc:
        raise ModelServiceError(f"model service unreachable at {MODEL_SERVICE_URL}: {exc}") from exc

    if resp.status_code >= 400:
        detail = resp.text
        try:
            detail = resp.json().get("detail", detail)
        except ValueError:
            pass
        raise ModelServiceError(f"model service returned {resp.status_code}: {detail}")

    return resp.json()
