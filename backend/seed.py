"""Initial demo data: the 15 Palkhi-route locations and a starting
operational snapshot (+ a short synthetic history) for each, so the
Intel page has something real to analyze the moment both services are
up — without requiring a supervisor to submit reports first.

Values are hand-tuned to roughly match the mock data the frontend used
before this integration (assets/js/app.js LOCATIONS/CAMPS/PALKHI), so
the story stays consistent: Jejuri's medical camps are under strain,
Lonand has the Palkhi's current position with rising congestion and
Dindi concentration, Natepute has a fresh critical traffic incident.
"""
from __future__ import annotations

import copy
from datetime import datetime, timedelta, timezone

LOCATIONS = [
    {"id": "alandi", "name_en": "Alandi", "name_mr": "आळंदी"},
    {"id": "pune", "name_en": "Pune", "name_mr": "पुणे"},
    {"id": "saswad", "name_en": "Saswad", "name_mr": "सासवड"},
    {"id": "jejuri", "name_en": "Jejuri", "name_mr": "जेजुरी"},
    {"id": "walhe", "name_en": "Walhe", "name_mr": "वाल्हे"},
    {"id": "lonand", "name_en": "Lonand", "name_mr": "लोणंद"},
    {"id": "taradgaon", "name_en": "Taradgaon", "name_mr": "तरडगाव"},
    {"id": "phaltan", "name_en": "Phaltan", "name_mr": "फलटण"},
    {"id": "natepute", "name_en": "Natepute", "name_mr": "नातेपुते"},
    {"id": "malshiras", "name_en": "Malshiras", "name_mr": "माळशिरस"},
    {"id": "velapur", "name_en": "Velapur", "name_mr": "वेळापूर"},
    {"id": "bhandishegaon", "name_en": "Bhandishegaon", "name_mr": "भंडीशेगाव"},
    {"id": "wakhari", "name_en": "Wakhari", "name_mr": "वाखरी"},
    {"id": "barad", "name_en": "Barad", "name_mr": "बरड"},
    {"id": "pandharpur", "name_en": "Pandharpur", "name_mr": "पंढरपूर"},
]


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def base_state(ts: datetime) -> dict:
    return {
        "timestamp": _iso(ts),
        "palkhi": {"delay_minutes": 0, "eta_minutes": None, "on_route": True},
        "dindi": {"concentration": 32, "headcount": 850, "delay_minutes": 2, "open_issues": 0},
        "medical": {
            "camp_load_pct": 20,
            "ambulance_available": 0,
            "ambulance_required": 0,
            "medicine_stock_pct": 100,
            "icu_available": 0,
            "emergency_referrals": 0,
        },
        "traffic": {"congestion_level": 18, "route_blocked": False, "open_incidents": 0},
        "municipal": {"water_readiness_pct": 90, "shelter_occupancy_pct": 25, "electricity_ok": True},
        "sanitation": {"facility_readiness_pct": 90, "cleanliness_pct": 90},
        "weather": {"rainfall_mm": 0, "condition": "clear", "route_hazard": False},
        "halt": {"readiness_pct": 88},
        "incidents": [],
    }


def _scale(state: dict, factor: float) -> dict:
    """Roll a state gently back toward a calmer baseline for older history ticks."""
    s = copy.deepcopy(state)
    base = base_state(datetime.now(timezone.utc))

    def blend(cur, base_val):
        return round(base_val + (cur - base_val) * factor, 1)

    s["dindi"]["concentration"] = blend(s["dindi"]["concentration"], base["dindi"]["concentration"])
    s["medical"]["camp_load_pct"] = blend(s["medical"]["camp_load_pct"], base["medical"]["camp_load_pct"])
    s["medical"]["medicine_stock_pct"] = blend(s["medical"]["medicine_stock_pct"], 100)
    s["medical"]["ambulance_available"] = max(0, round(blend(s["medical"]["ambulance_available"], s["medical"]["ambulance_required"])))
    s["traffic"]["congestion_level"] = blend(s["traffic"]["congestion_level"], base["traffic"]["congestion_level"])
    s["weather"]["rainfall_mm"] = blend(s["weather"]["rainfall_mm"], 0)
    s["halt"]["readiness_pct"] = blend(s["halt"]["readiness_pct"], base["halt"]["readiness_pct"])
    s["incidents"] = []
    s["traffic"]["route_blocked"] = False
    s["traffic"]["open_incidents"] = 0
    return s


def _history(current: dict, ticks: int = 4, minutes_apart: int = 25, worsening: bool = True) -> list[dict]:
    """Build `ticks` history entries (oldest first) leading up to `current`.

    The model's rate calculation reads each tick's *inner* state.timestamp
    (not just the outer HistoryTick.timestamp), so both must carry the
    tick's own time or the elapsed-time math collapses to ~0.
    """
    now = datetime.fromisoformat(current["timestamp"])
    out = []
    for i in range(ticks, 0, -1):
        ts = now - timedelta(minutes=minutes_apart * i)
        factor = 1 - (i / (ticks + 1)) if worsening else 0.92
        state = _scale(current, factor)
        state["timestamp"] = _iso(ts)
        out.append({"timestamp": _iso(ts), "state": state})
    return out


def _overrides() -> dict[str, dict]:
    now = datetime.now(timezone.utc)

    jejuri = base_state(now)
    jejuri["dindi"].update({"concentration": 58, "headcount": 1400, "open_issues": 1})
    jejuri["medical"].update(
        {
            "camp_load_pct": 88,
            "ambulance_available": 2,
            "ambulance_required": 4,
            "medicine_stock_pct": 18,
            "icu_available": 0,
            "emergency_referrals": 2,
        }
    )
    jejuri["traffic"].update({"congestion_level": 55, "open_incidents": 0})
    jejuri["sanitation"].update({"facility_readiness_pct": 50, "cleanliness_pct": 55})
    jejuri["halt"]["readiness_pct"] = 55
    jejuri["incidents"] = [
        {
            "id": "inc-jejuri-amb",
            "category": "medical",
            "severity": "critical",
            "status": "reported",
            "description": "Ambulance availability down to 2 vehicles at Camp 3",
            "authority": "Medical Authority",
            "timestamp": _iso(now),
        }
    ]

    lonand = base_state(now)
    lonand["palkhi"].update({"delay_minutes": 22, "eta_minutes": 40, "on_route": True})
    lonand["dindi"].update({"concentration": 78, "headcount": 1180, "delay_minutes": 22, "open_issues": 1})
    lonand["traffic"].update({"congestion_level": 72, "route_blocked": False, "open_incidents": 1})
    lonand["municipal"].update({"water_readiness_pct": 78, "shelter_occupancy_pct": 68})
    lonand["weather"].update({"rainfall_mm": 12, "condition": "rain", "route_hazard": False})
    lonand["halt"]["readiness_pct"] = 62
    lonand["incidents"] = [
        {
            "id": "inc-lonand-congestion",
            "category": "traffic",
            "severity": "high",
            "status": "acknowledged",
            "description": "Congestion high on the state highway diversion",
            "authority": "Police Authority",
            "timestamp": _iso(now),
        }
    ]

    natepute = base_state(now)
    natepute["traffic"].update({"congestion_level": 85, "route_blocked": True, "open_incidents": 1})
    natepute["halt"]["readiness_pct"] = 70
    natepute["incidents"] = [
        {
            "id": "inc-natepute-collision",
            "category": "accident",
            "severity": "critical",
            "status": "reported",
            "description": "Two-wheeler collision on the approach — lane blocked",
            "authority": "Police Authority",
            "timestamp": _iso(now),
        }
    ]

    wakhari = base_state(now)
    wakhari["medical"].update(
        {"camp_load_pct": 44, "ambulance_available": 1, "ambulance_required": 2, "medicine_stock_pct": 60}
    )

    phaltan = base_state(now)
    phaltan["medical"].update(
        {"camp_load_pct": 46, "ambulance_available": 3, "ambulance_required": 3, "medicine_stock_pct": 47}
    )

    pune = base_state(now)
    pune["sanitation"].update({"facility_readiness_pct": 55, "cleanliness_pct": 60})

    walhe = base_state(now)
    walhe["municipal"].update({"water_readiness_pct": 55, "shelter_occupancy_pct": 70})

    malshiras = base_state(now)
    malshiras["sanitation"].update({"facility_readiness_pct": 45, "cleanliness_pct": 50})

    return {
        "jejuri": jejuri,
        "lonand": lonand,
        "natepute": natepute,
        "wakhari": wakhari,
        "phaltan": phaltan,
        "pune": pune,
        "walhe": walhe,
        "malshiras": malshiras,
    }


def populate_if_empty(store) -> None:
    if not store.is_empty():
        return

    overrides = _overrides()
    now = datetime.now(timezone.utc)

    for loc in LOCATIONS:
        store.upsert_location(loc["id"], loc["name_en"], loc["name_mr"])
        current = overrides.get(loc["id"]) or base_state(now)
        # Natepute's incident just happened — a short, flat history so the
        # model reads it as newly critical rather than a slow trend.
        worsening = loc["id"] != "natepute"
        ticks = 2 if loc["id"] == "natepute" else 4
        for tick in _history(current, ticks=ticks, worsening=worsening):
            store.append_history(loc["id"], tick["timestamp"], tick["state"])
        store.set_current_state(loc["id"], current, current["timestamp"])


# ── patient registry seed ────────────────────────────────────────────────
# Same roster the frontend used to mock locally (assets/js/app.js PATIENTS),
# now the real source of truth. Ramesh Jadhav gets two visits on purpose —
# an earlier one at a different camp — so the duplicate-name check on the
# Medical page's registration form has something real to surface immediately.
PATIENTS = [
    {"id": "P-1041", "name": "Ramesh Jadhav", "age": 58, "camp_id": "jejuri-1", "condition": "Twisted ankle", "status": "discharged", "notes": "", "hours_ago": 72},
    {"id": "P-1042", "name": "Ramesh Jadhav", "age": 58, "camp_id": "jejuri-3", "condition": "Heat exhaustion", "status": "admitted", "notes": "", "hours_ago": 2},
    {"id": "P-1043", "name": "Sunita More", "age": 34, "camp_id": "jejuri-3", "condition": "Dehydration", "status": "admitted", "notes": "", "hours_ago": 10},
    {"id": "P-1044", "name": "Anil Kadam", "age": 61, "camp_id": "jejuri-2", "condition": "High blood pressure", "status": "discharged", "notes": "", "hours_ago": 26},
    {"id": "P-1045", "name": "Vaishali Pawar", "age": 27, "camp_id": "wakhari-1", "condition": "Minor foot injury", "status": "discharged", "notes": "", "hours_ago": 30},
    {"id": "P-1046", "name": "Ganesh Shinde", "age": 45, "camp_id": "phaltan-1", "condition": "Fever", "status": "admitted", "notes": "", "hours_ago": 5},
    {"id": "P-1047", "name": "Kavita Bhosale", "age": 39, "camp_id": "jejuri-1", "condition": "Gastro upset", "status": "discharged", "notes": "", "hours_ago": 34},
    {"id": "P-1048", "name": "Dattu Salunkhe", "age": 66, "camp_id": "jejuri-3", "condition": "Chest discomfort", "status": "referred", "notes": "Referred to district hospital.", "hours_ago": 3},
    {"id": "P-1049", "name": "Meera Gaikwad", "age": 22, "camp_id": "wakhari-1", "condition": "Blister / abrasion", "status": "discharged", "notes": "", "hours_ago": 40},
    {"id": "P-1050", "name": "Baban Chavan", "age": 71, "camp_id": "jejuri-2", "condition": "Dehydration", "status": "admitted", "notes": "", "hours_ago": 6},
    {"id": "P-1051", "name": "Pratibha Kale", "age": 48, "camp_id": "phaltan-1", "condition": "Fracture (wrist)", "status": "referred", "notes": "", "hours_ago": 20},
    {"id": "P-1052", "name": "Suresh Deshmukh", "age": 55, "camp_id": "jejuri-1", "condition": "Fever", "status": "admitted", "notes": "", "hours_ago": 8},
    {"id": "P-1053", "name": "Nirmala Jagtap", "age": 63, "camp_id": "jejuri-3", "condition": "Heat exhaustion", "status": "admitted", "notes": "", "hours_ago": 4},
    {"id": "P-1054", "name": "Vitthal Pathare", "age": 40, "camp_id": "wakhari-1", "condition": "Minor injury", "status": "discharged", "notes": "", "hours_ago": 46},
    {"id": "P-1055", "name": "Sarika Wagh", "age": 31, "camp_id": "phaltan-1", "condition": "Gastro upset", "status": "discharged", "notes": "", "hours_ago": 15},
]


def populate_patients_if_empty(store) -> None:
    if not store.patients_is_empty():
        return
    now = datetime.now(timezone.utc)
    for p in PATIENTS:
        record = {
            "id": p["id"],
            "name": p["name"],
            "age": p["age"],
            "camp_id": p["camp_id"],
            "condition": p["condition"],
            "status": p["status"],
            "notes": p["notes"],
            "registered_by": "medical",
            "registered_at": _iso(now - timedelta(hours=p["hours_ago"])),
        }
        store.insert_patient(record)


# ── demo authority accounts ─────────────────────────────────────────────
# One per role in the frontend's ROLES list (assets/js/app.js). The role
# recorded here is what actually decides which tabs the account can open —
# the login screen's tile is only a hint, and is checked against this.
DEMO_USERS = [
    {"username": "dindi",      "role": "dindi",      "password": "Dindi@2026",      "display_name": "Dindi Coordinator"},
    {"username": "medical",    "role": "medical",    "password": "Medical@2026",    "display_name": "Medical Authority"},
    {"username": "police",     "role": "police",     "password": "Police@2026",     "display_name": "Police Authority"},
    {"username": "municipal",  "role": "municipal",  "password": "Municipal@2026",  "display_name": "Municipal Authority"},
    {"username": "sanitation", "role": "sanitation", "password": "Sanitation@2026", "display_name": "Sanitation Authority"},
    {"username": "supervisor", "role": "supervisor", "password": "Supervisor@2026", "display_name": "Wari Supervisor"},
]


def populate_users_if_empty(store, hash_password) -> None:
    """Create the six demo accounts.

    Runs on every boot rather than only on an empty table, so adding a role
    later still gets an account — insert_user is INSERT OR IGNORE, so an
    account whose password was already changed is never reset.
    """
    now = _iso(datetime.now(timezone.utc))
    for u in DEMO_USERS:
        salt, digest, iterations = hash_password(u["password"])
        store.insert_user({
            "username": u["username"],
            "role": u["role"],
            "display_name": u["display_name"],
            "pass_salt": salt,
            "pass_hash": digest,
            "iterations": iterations,
            "created_at": now,
        })
