# Model integration contract (Flask backend ↔ model service)

This document is the integration contract for the standalone Wari Command Intelligence **model service**. The Flask backend is not implemented here. The model service does not read MySQL, Supabase, or any other store.

## Service location

| Item | Value |
| --- | --- |
| Process | FastAPI app in `model_service/main.py` |
| Default URL | `http://127.0.0.1:8001` |
| Intelligence endpoint | **`POST /model/analyze`** |
| Liveness | `GET /health` |
| OpenAPI | `GET /docs` |

Run:

```bash
cd model_service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Suggested Flask setting: `MODEL_SERVICE_URL=http://127.0.0.1:8001`

## Ownership split

| Layer | Owns | Must not |
| --- | --- | --- |
| Flask + MySQL | Auth, roles, persistence, assembling `current` + `history`, storing `intelligence_results`, pushing live UI | Compute risk, invent priorities, call an LLM for safety decisions |
| Model service | Readiness, risk, trends, correlations, gaps, rate, freshness, confidence, priorities, suppression, deterministic summary | Query a database, know about users/sessions, render UI |

Call the model **after** an authority update changes operational state for a location, and on supervisor refresh. Pass **only** the location snapshot plus 3–5 recent ticks.

## `POST /model/analyze`

Content-Type: `application/json`

### Request

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `location_id` | string | yes | Stable location/halt/camp id from your `locations` table |
| `location_name` | string \| null | no | Display name (e.g. Jejuri) |
| `analyzed_at` | ISO-8601 datetime \| null | no | Clock for freshness; UTC recommended. Default: service now |
| `current` | `WariState` | yes | Latest operational snapshot |
| `history` | `HistoryTick[]` | no | Oldest first. Send **3–5** ticks. Max 5 (extras truncated) |
| `previous_fingerprint` | string \| null | no | `fingerprint` from the last stored response for this location |
| `previous_risk_score` | int 0–100 \| null | no | Last stored `risk_score` |
| `previous_situation_class` | string \| null | no | Last stored `situation_class` |
| `options.use_llm_phrasing` | bool | no | Default `false`. Rephrases summary only |
| `options.max_priorities` | int 1–10 | no | Default `5` |

#### `WariState`

| Field | Type | Meaning |
| --- | --- | --- |
| `timestamp` | datetime | When this snapshot was true in the field |
| `palkhi.delay_minutes` | int ≥ 0 | Minutes behind schedule |
| `palkhi.eta_minutes` | int \| null | Optional ETA |
| `palkhi.on_route` | bool | Default true |
| `dindi.concentration` | 0–100 | Crowd / Dindi concentration |
| `dindi.headcount` | int | Reported headcount |
| `dindi.delay_minutes` | int | Dindi delay |
| `dindi.open_issues` | int | Open member/vehicle issues |
| `medical.camp_load_pct` | 0–100 | Camp occupancy / load |
| `medical.ambulance_available` | int | Count available |
| `medical.ambulance_required` | int | Count needed at this location |
| `medical.medicine_stock_pct` | 0–100 | Stock remaining |
| `medical.icu_available` | int | Optional ICU/resource count |
| `medical.emergency_referrals` | int | Open emergency/referrals |
| `traffic.congestion_level` | 0–100 | Police/traffic congestion |
| `traffic.route_blocked` | bool | Route blocked |
| `traffic.open_incidents` | int | Open traffic incidents |
| `municipal.water_readiness_pct` | 0–100 | Water readiness (high = better) |
| `municipal.shelter_occupancy_pct` | 0–100 | Shelter fill |
| `municipal.electricity_ok` | bool | Power OK |
| `sanitation.facility_readiness_pct` | 0–100 | Toilets/facilities |
| `sanitation.cleanliness_pct` | 0–100 | Cleanliness |
| `weather.rainfall_mm` | float ≥ 0 | Rain |
| `weather.condition` | string | Free text, e.g. `clear` / `rain` |
| `weather.route_hazard` | bool | Hazardous route |
| `halt.readiness_pct` | 0–100 | Halt readiness |
| `incidents` | `Incident[]` | Active/recent incidents at this location |

#### `Incident`

| Field | Values |
| --- | --- |
| `id` | string |
| `category` | string |
| `severity` | `low` \| `medium` \| `high` \| `critical` |
| `status` | `reported` \| `acknowledged` \| `in_progress` \| `resolved` |
| `description` | string |
| `authority` | string |
| `timestamp` | datetime \| null |

#### `HistoryTick`

```json
{ "timestamp": "<ISO-8601>", "state": { /* same as current WariState */ } }
```

Use the persisted operational snapshot at each tick, not raw form rows.

### Response (always present)

Validate with Pydantic `AnalyzeResponse` or equivalent. Required top-level fields:

| Field | Type | Use in supervisor UI |
| --- | --- | --- |
| `location_id` | string | Join key |
| `location_name` | string \| null | Title |
| `analyzed_at` | datetime | “As of” |
| `model_version` | string | Store for audit |
| `risk_score` | int 0–100 | Gauge |
| `status` | `NORMAL` \| `ELEVATED` \| `HIGH` \| `CRITICAL` | Badge |
| `headline` | string | Top line |
| `key_factors` | string[] | Bullets |
| `change` | object | What changed |
| `situation_summary` | string | Daily/card summary |
| `situation_class` | see below | Timeline filter |
| `resource_gaps` | object[] | Gaps panel |
| `emerging_risks` | object[] | Emerging panel |
| `priority_actions` | object[] | Attention list |
| `correlations` | object[] | Optional debug / “why” |
| `data_freshness` | object | Confidence strip |
| `confidence` | object | Confidence strip |
| `readiness` | object | Readiness |
| `domain_scores` | object[] | Domain breakdown |
| `suppressed` | bool | Hide duplicate alerts if true |
| `suppression_reason` | string \| null | Why hidden |
| `fingerprint` | string | Persist; send back next call |
| `deterministic` | bool | Always `true` for scores |
| `phrasing_source` | `deterministic` \| `llm` | Audit |

#### `situation_class`

`stable` | `stable_high_pressure` | `rapidly_worsening` | `improving` | `newly_critical` | `resolved`

#### `change`

- `direction`: `stable` | `worsening` | `improving` | `mixed`
- `summary`: string
- `domains[]`: `{ domain, previous_pressure, current_pressure, delta, direction }`
- `newly_critical_domains[]`
- `resolved_domains[]`

#### `resource_gaps[]`

`id`, `domain`, `resource`, `severity`, `shortfall`, `detail`

#### `priority_actions[]`

`rank`, `action`, `authority`, `domain`, `severity`, `why`, `suppressed`

If `suppressed` is true on the response, treat actions as **not new alerts**. Still store the payload.

## Flask call sketch

```python
import os
import requests

MODEL_URL = os.environ.get("MODEL_SERVICE_URL", "http://127.0.0.1:8001")

def analyze_location(location_id: str, current: dict, history: list, previous: dict | None):
    payload = {
        "location_id": location_id,
        "location_name": current.get("location_name"),
        "current": current["state"],
        "history": history,  # 3–5 items, oldest first
        "previous_fingerprint": (previous or {}).get("fingerprint"),
        "previous_risk_score": (previous or {}).get("risk_score"),
        "previous_situation_class": (previous or {}).get("situation_class"),
        "options": {"use_llm_phrasing": False},
    }
    response = requests.post(f"{MODEL_URL}/model/analyze", json=payload, timeout=8)
    response.raise_for_status()
    body = response.json()
    for key in (
        "risk_score", "status", "headline", "key_factors", "change",
        "situation_summary", "resource_gaps", "emerging_risks",
        "priority_actions", "data_freshness", "confidence", "fingerprint",
    ):
        if key not in body:
            raise ValueError(f"model response missing {key}")
    return body
```

Suggested table: `intelligence_results` (`location_id`, `analyzed_at`, `risk_score`, `status`, `payload_json`, `fingerprint`).

## Mapping from product tables (backend responsibility)

Assemble `current` from latest rows keyed by `location_id`:

- `palkhi_positions` → `palkhi`
- Dindi `status_updates` → `dindi`
- `medical_camps` / resources → `medical`
- Police incidents / traffic updates → `traffic` + `incidents`
- Municipal updates → `municipal`, `halt`
- Sanitation updates → `sanitation`
- Weather overlay if present → `weather`

History ticks: last 3–5 **stored snapshots** of that same assembled state (or a `location_state_history` table), not the last 3 form posts of a single authority.

## Rules the backend must obey

1. **Do not** send database credentials or user tokens to the model.
2. **Do not** let the LLM (or Flask) override `risk_score`, `status`, gaps, or actions.
3. On HTTP 422, fix the payload; on 5xx, keep last good intelligence and mark freshness stale in UI if you wish.
4. Duplicate suppression requires you to **persist and return** `fingerprint`, `risk_score`, and `situation_class`.
5. Timezones: prefer UTC ISO-8601 with offset (`2026-06-20T10:00:00+00:00`).

## Sample request

```json
{
  "location_id": "loc-jejuri",
  "location_name": "Jejuri",
  "current": {
    "timestamp": "2026-06-20T10:00:00+00:00",
    "palkhi": { "delay_minutes": 22, "eta_minutes": 40, "on_route": true },
    "dindi": { "concentration": 70, "headcount": 1200, "delay_minutes": 15, "open_issues": 1 },
    "medical": {
      "camp_load_pct": 82,
      "ambulance_available": 1,
      "ambulance_required": 4,
      "medicine_stock_pct": 28,
      "icu_available": 1,
      "emergency_referrals": 2
    },
    "traffic": { "congestion_level": 75, "route_blocked": false, "open_incidents": 1 },
    "municipal": { "water_readiness_pct": 80, "shelter_occupancy_pct": 40, "electricity_ok": true },
    "sanitation": { "facility_readiness_pct": 70, "cleanliness_pct": 65 },
    "weather": { "rainfall_mm": 12, "condition": "rain", "route_hazard": false },
    "halt": { "readiness_pct": 60 },
    "incidents": []
  },
  "history": [],
  "options": { "use_llm_phrasing": false }
}
```

`history` should normally contain 3–5 ticks; empty history is valid but lowers confidence.

## Sample response shape

```json
{
  "location_id": "loc-jejuri",
  "risk_score": 64,
  "status": "HIGH",
  "headline": "Jejuri — HIGH: Medical pressure …",
  "situation_class": "rapidly_worsening",
  "suppressed": false,
  "fingerprint": "a1b2c3d4e5f60789",
  "phrasing_source": "deterministic"
}
```

Full field set is defined by `model_service/schemas.py` (`AnalyzeResponse`).
