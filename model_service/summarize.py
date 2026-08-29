"""Optional LLM phrasing of an already-computed deterministic summary.

The LLM must never compute risk, status, gaps, or actions. It may only rewrite
the provided summary text. Any failure falls back to the deterministic text.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from schemas import AnalyzeResponse, ResourceGap


def deterministic_summary(
    location: str,
    status: str,
    risk_score: int,
    situation_class: str,
    change_summary: str,
    key_factors: list[str],
    gaps: list[ResourceGap],
    emerging_titles: list[str],
    actions: list[str],
) -> str:
    critical = "; ".join(key_factors[:3]) if key_factors else "no dominant pressure factor"
    gap_text = ", ".join(item.resource for item in gaps) if gaps else "none identified"
    developing = "; ".join(emerging_titles[:3]) if emerging_titles else "no rapid new deterioration"
    attention = "; ".join(actions[:3]) if actions else "continue routine monitoring"
    class_label = situation_class.replace("_", " ")
    return (
        f"WARI STATUS — {status} (risk {risk_score}) at {location}. "
        f"Situation class: {class_label}. "
        f"Critical now: {critical}. "
        f"Developing: {developing}. "
        f"Resource gaps: {gap_text}. "
        f"What changed: {change_summary} "
        f"Attention: {attention}."
    )


def phrase_summary(summary: str, use_llm: bool) -> tuple[str, str]:
    if not use_llm:
        return summary, "deterministic"
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        return summary, "deterministic"

    payload = {
        "model": os.environ.get("WARI_LLM_MODEL", "gpt-4o-mini"),
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You rephrase a Wari supervisor situation summary. "
                    "Do not add facts, numbers, locations, or recommendations "
                    "that are not already in the source. Do not calculate risk."
                ),
            },
            {"role": "user", "content": summary},
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            body = json.loads(response.read().decode("utf-8"))
        text = (body["choices"][0]["message"]["content"] or "").strip()
        if not text:
            return summary, "deterministic"
        return text, "llm"
    except (urllib.error.URLError, KeyError, IndexError, TimeoutError, json.JSONDecodeError):
        return summary, "deterministic"


def apply_phrasing(response: AnalyzeResponse, use_llm: bool) -> AnalyzeResponse:
    text, source = phrase_summary(response.situation_summary, use_llm)
    return response.model_copy(update={"situation_summary": text, "phrasing_source": source})
