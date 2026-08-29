"""Server-to-server client for the model service's POST /model/analyze.

Per MODEL_INTEGRATION.md: only the Flask backend talks to the model
service. The browser never calls it directly.
"""
from __future__ import annotations

import functools
import os
import sys

import requests

MODEL_SERVICE_URL = os.environ.get("MODEL_SERVICE_URL", "http://127.0.0.1:8001").strip()
TIMEOUT_SECONDS = 8

# ── in-process mode ─────────────────────────────────────────────────────
# Set MODEL_SERVICE_URL="inprocess" to import the model package and call
# analyze() directly instead of over HTTP. Needed on serverless hosts,
# where one function calling another over the network would pay a cold
# start per location and blow the request timeout. The model is a pure
# deterministic function with no I/O of its own, so calling it directly
# produces byte-identical results to the HTTP path.
#
# Unset, the default stays the HTTP URL — local development runs the two
# services separately exactly as before.
INPROCESS = MODEL_SERVICE_URL.lower() in {"", "inprocess", "in-process", "local"}

_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model_service")


@functools.lru_cache(maxsize=1)
def _load_model():
    """Import the model package once. Its modules import each other flatly
    (`from config import ...`), so its directory goes on sys.path."""
    if _MODEL_DIR not in sys.path:
        sys.path.insert(0, _MODEL_DIR)
    from intel import analyze as _analyze  # type: ignore[import-not-found]
    from schemas import AnalyzeRequest  # type: ignore[import-not-found]
    return _analyze, AnalyzeRequest


class ModelServiceError(Exception):
    """Raised when the model service is unreachable or returns an error."""


def health() -> bool:
    if INPROCESS:
        try:
            _load_model()
            return True
        except Exception:
            return False
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

    if INPROCESS:
        try:
            _analyze, AnalyzeRequest = _load_model()
            # mode="json" so datetimes serialise exactly as the HTTP path's
            # resp.json() delivered them — callers see no difference.
            return _analyze(AnalyzeRequest(**payload)).model_dump(mode="json")
        except Exception as exc:  # pydantic validation, import failure, model bug
            raise ModelServiceError(f"in-process model call failed: {exc}") from exc

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
