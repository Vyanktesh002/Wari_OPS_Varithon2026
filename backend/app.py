"""Wari Command Intelligence — Flask backend.

Owns auth-free persistence and orchestration for the Command Center demo:
holds the current operational snapshot + short history per location,
calls the model service (model_service/) for scoring, stores results,
and serves them to the static frontend (Wari Project/) as JSON.

Per MODEL_INTEGRATION.md's ownership split, this layer never computes
risk itself — it only assembles state, calls the model, and persists
+ serves what comes back.

Run:
    cd backend
    python -m pip install -r requirements.txt
    python app.py
Defaults to http://127.0.0.1:5050 — override with PORT.
Expects the model service at http://127.0.0.1:8001 — override with
MODEL_SERVICE_URL (see model_client.py).
"""
from __future__ import annotations

import copy
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, request

import model_client
import seed
import store

app = Flask(__name__)

DB_PATH = os.environ.get("WCI_DB_PATH", os.path.join(os.path.dirname(__file__), "wci.db"))
SEVERITY_RANK = {"critical": 3, "high": 2, "medium": 1, "low": 0}
STATUS_RANK = {"NORMAL": 0, "ELEVATED": 1, "HIGH": 2, "CRITICAL": 3}

# ── password hashing (stdlib only — no new dependency) ──────────────────
PBKDF2_ITERATIONS = 200_000
SESSION_TTL_HOURS = 12


def hash_password(password: str, salt: str | None = None, iterations: int = PBKDF2_ITERATIONS):
    """Returns (salt_hex, hash_hex, iterations). PBKDF2-HMAC-SHA256."""
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations)
    return salt, digest.hex(), iterations


def verify_password(password: str, salt: str, expected_hash: str, iterations: int) -> bool:
    _, actual, _ = hash_password(password, salt, iterations)
    return hmac.compare_digest(actual, expected_hash)


def _bootstrap() -> None:
    store.init_db(DB_PATH)
    seed.populate_if_empty(store)
    seed.populate_patients_if_empty(store)
    seed.populate_users_if_empty(store, hash_password)


_bootstrap()


# ── CORS (manual — no flask-cors dependency) ────────────────────────────
# Defaults to "*" so local development keeps working with the frontend on
# any port. In a deployment set WCI_ALLOWED_ORIGIN to the site's own origin
# (e.g. https://wari.vercel.app) so only that page can call this API.
ALLOWED_ORIGIN = os.environ.get("WCI_ALLOWED_ORIGIN", "*").strip() or "*"


@app.after_request
def _add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    if ALLOWED_ORIGIN != "*":
        # Caches must not serve one origin's response to another.
        resp.headers["Vary"] = "Origin"
    return resp


@app.before_request
def _handle_preflight():
    if request.method == "OPTIONS":
        return ("", 204)


# ── health ───────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "model_service": "ok" if model_client.health() else "unreachable",
        # "postgres" means data is durable; "sqlite" means it lives in a
        # local file (and on a serverless host, only until the next cold start).
        "database": store.dialect(),
    })


@app.get("/api/locations")
def locations():
    return jsonify(store.list_locations())


# ── authentication ───────────────────────────────────────────────────────
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _bearer_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return None


def _session_from_request() -> dict | None:
    """The active session for this request, or None. Expired tokens are dropped."""
    token = _bearer_token()
    if not token:
        return None
    session = store.get_session(token)
    if not session:
        return None
    if session["expires_at"] < _now().isoformat():
        store.delete_session(token)
        return None
    if not session["active"]:
        return None
    return session


@app.post("/api/auth/login")
def auth_login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    want_role = (body.get("role") or "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = store.get_user(username)
    # Same message and roughly the same work either way, so a wrong username
    # is not distinguishable from a wrong password.
    if user is None:
        hash_password(password)
        return jsonify({"error": "Incorrect username or password."}), 401
    if not verify_password(password, user["pass_salt"], user["pass_hash"], user["iterations"]):
        return jsonify({"error": "Incorrect username or password."}), 401
    if not user["active"]:
        return jsonify({"error": "This account is disabled."}), 403
    if want_role and want_role != user["role"]:
        return jsonify({
            "error": f"These credentials belong to the {user['display_name']} account. "
                     f"Pick that authority on the previous screen."
        }), 403

    now = _now()
    store.purge_expired_sessions(now.isoformat())
    token = secrets.token_urlsafe(32)
    store.create_session(
        token, user["username"], now.isoformat(), (now + timedelta(hours=SESSION_TTL_HOURS)).isoformat()
    )
    store.touch_user_login(user["username"], now.isoformat())

    return jsonify({
        "token": token,
        "username": user["username"],
        "role": user["role"],
        "display_name": user["display_name"],
        "expires_in": SESSION_TTL_HOURS * 3600,
    })


@app.get("/api/auth/me")
def auth_me():
    session = _session_from_request()
    if not session:
        return jsonify({"error": "Not authenticated."}), 401
    return jsonify({
        "username": session["username"],
        "role": session["role"],
        "display_name": session["display_name"],
    })


@app.post("/api/auth/logout")
def auth_logout():
    token = _bearer_token()
    if token:
        store.delete_session(token)
    return jsonify({"ok": True})


# ── analysis ─────────────────────────────────────────────────────────────
def _run_analysis(location_id: str) -> dict:
    loc = store.get_location(location_id)
    current = store.get_current_state(location_id)
    if current is None:
        raise ValueError(f"no state recorded for location {location_id}")
    history = store.get_history(location_id)
    previous = store.get_last_intel(location_id)
    result = model_client.analyze(
        location_id=location_id,
        location_name=loc["name_en"] if loc else None,
        current_state=current,
        history_ticks=history,
        previous=previous,
    )
    store.save_intel(location_id, result)
    return result


@app.get("/api/intel/<location_id>")
def intel_for_location(location_id: str):
    if not store.get_location(location_id):
        return jsonify({"error": "unknown location_id"}), 404
    refresh = request.args.get("refresh") == "1"
    cached = store.get_last_intel(location_id)
    if cached and not refresh:
        return jsonify(cached["payload"])
    try:
        return jsonify(_run_analysis(location_id))
    except model_client.ModelServiceError as exc:
        return jsonify({"error": str(exc)}), 503


FRONTEND_DOMAINS = {"police": "traffic", "medical": "medical", "municipal": "municipal", "sanitation": "sanitation"}


def _pressure_status(pressure: int) -> str:
    if pressure >= 60:
        return "crit"
    if pressure >= 35:
        return "warn"
    return "ok"


def _frontend_domain_statuses(result: dict) -> dict:
    """Map the model's 9 domains onto the 4 the frontend's Dashboard/Live Ops
    grids already render, so a real report visibly changes those too."""
    pressures = {d["domain"]: d["pressure"] for d in result["domain_scores"]}
    return {fe: _pressure_status(pressures.get(model_dom, 0)) for fe, model_dom in FRONTEND_DOMAINS.items()}


def _build_summary(results: list[dict]) -> dict:
    worst = max(results, key=lambda r: r["risk_score"])
    overall_status = max((r["status"] for r in results), key=lambda s: STATUS_RANK.get(s, 0))
    avg_risk = round(sum(r["risk_score"] for r in results) / len(results))

    gaps, emerging, actions, key_factors = [], [], [], []
    for r in results:
        label = r.get("location_name") or r["location_id"]
        for g in r["resource_gaps"]:
            gaps.append({**g, "location_id": r["location_id"], "location_name": label})
        for e in r["emerging_risks"]:
            emerging.append({**e, "location_id": r["location_id"], "location_name": label})
        for a in r["priority_actions"]:
            actions.append({**a, "location_id": r["location_id"], "location_name": label})
        if r["risk_score"] >= 40:
            key_factors.append(f"{label}: {r['headline']}")

    gaps.sort(key=lambda g: SEVERITY_RANK.get(g["severity"], 0), reverse=True)
    emerging.sort(key=lambda e: SEVERITY_RANK.get(e["severity"], 0), reverse=True)
    actions.sort(key=lambda a: SEVERITY_RANK.get(a["severity"], 0), reverse=True)

    ranked = sorted(results, key=lambda r: r["risk_score"], reverse=True)
    if not key_factors:
        key_factors = [f"{(r.get('location_name') or r['location_id'])}: {r['headline']}" for r in ranked[:3]]

    return {
        "risk_score": worst["risk_score"],
        "average_risk_score": avg_risk,
        "status": overall_status,
        "headline": worst["headline"],
        "worst_location": {"id": worst["location_id"], "name": worst.get("location_name")},
        "key_factors": key_factors[:6],
        "resource_gaps": gaps[:8],
        "emerging_risks": emerging[:6],
        "priority_actions": actions[:6],
        "confidence": worst["confidence"],
        "data_freshness": worst["data_freshness"],
        "model_version": worst["model_version"],
        "analyzed_at": worst["analyzed_at"],
        "locations_ranked": [
            {
                "id": r["location_id"],
                "name": r.get("location_name"),
                "risk_score": r["risk_score"],
                "status": r["status"],
                "situation_class": r["situation_class"],
                "headline": r["headline"],
                "domains": _frontend_domain_statuses(r),
            }
            for r in ranked
        ],
    }


@app.get("/api/intel")
def intel_summary():
    """Aggregate across every location — feeds the Supervisor Intel page."""
    refresh = request.args.get("refresh") == "1"
    results, errors = [], []
    for loc in store.list_locations():
        cached = store.get_last_intel(loc["id"])
        if cached and not refresh:
            results.append(cached["payload"])
            continue
        try:
            results.append(_run_analysis(loc["id"]))
        except (model_client.ModelServiceError, ValueError) as exc:
            errors.append({"location_id": loc["id"], "error": str(exc)})

    if not results:
        return jsonify({"error": "model service unavailable", "details": errors}), 503

    summary = _build_summary(results)
    summary["errors"] = errors
    return jsonify(summary)


# ── reports (Records page) ──────────────────────────────────────────────
CAMP_TO_LOCATION = {
    "jejuri-1": "jejuri",
    "jejuri-2": "jejuri",
    "jejuri-3": "jejuri",
    "wakhari-1": "wakhari",
    "phaltan-1": "phaltan",
}


def _clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def _apply_report(state: dict, role: str, body: dict) -> dict:
    state = copy.deepcopy(state)
    details = (body.get("details") or "").strip()
    now_iso = datetime.now(timezone.utc).isoformat()

    def add_incident(category: str, severity: str, description: str, authority: str) -> None:
        state["incidents"].append(
            {
                "id": f"inc-{role}-{uuid.uuid4().hex[:8]}",
                "category": category,
                "severity": severity if severity in SEVERITY_RANK else "medium",
                "status": "reported",
                "description": description or category,
                "authority": authority,
                "timestamp": now_iso,
            }
        )

    if role == "dindi":
        if str(body.get("headcount") or "").strip():
            state["dindi"]["headcount"] = max(0, int(float(body["headcount"])))
        if str(body.get("delay") or "").strip():
            state["dindi"]["delay_minutes"] = max(0, int(float(body["delay"])))
        if details:
            state["dindi"]["open_issues"] = state["dindi"].get("open_issues", 0) + 1

    elif role == "medical":
        rtype = body.get("type")
        m = state["medical"]
        if rtype == "opt.campLoad":
            m["camp_load_pct"] = _clamp(m["camp_load_pct"] + 12)
        elif rtype == "opt.medShortage":
            m["medicine_stock_pct"] = _clamp(m["medicine_stock_pct"] - 20)
        elif rtype == "opt.emergency":
            m["emergency_referrals"] += 1
            add_incident("medical", "high", details or "Emergency / referral reported", "Medical Authority")
        elif rtype == "opt.ambRequest":
            m["ambulance_required"] += 1
            m["ambulance_available"] = max(0, m["ambulance_available"] - 1)

    elif role == "police":
        rtype = body.get("type")
        severity = str(body.get("severity") or "opt.medium").replace("opt.", "")
        t = state["traffic"]
        if rtype == "opt.congestion":
            t["congestion_level"] = _clamp(t["congestion_level"] + 20)
        elif rtype == "opt.blockage":
            t["route_blocked"] = True
            t["congestion_level"] = _clamp(t["congestion_level"] + 15)
        elif rtype == "opt.crowdIssue":
            state["dindi"]["concentration"] = _clamp(state["dindi"]["concentration"] + 15)
        t["open_incidents"] = t.get("open_incidents", 0) + 1
        category = {
            "opt.accident": "accident",
            "opt.congestion": "congestion",
            "opt.blockage": "blockage",
            "opt.crowdIssue": "crowd",
        }.get(rtype, "incident")
        add_incident(category, severity, details or category, "Police Authority")

    elif role == "municipal":
        rtype = body.get("type")
        mu = state["municipal"]
        if rtype == "opt.water":
            mu["water_readiness_pct"] = _clamp(mu["water_readiness_pct"] - 20)
        elif rtype == "opt.shelter":
            mu["shelter_occupancy_pct"] = _clamp(mu["shelter_occupancy_pct"] + 20)
        elif rtype == "opt.electricity":
            mu["electricity_ok"] = False
        elif rtype == "opt.infra":
            state["halt"]["readiness_pct"] = _clamp(state["halt"]["readiness_pct"] - 15)

    elif role == "sanitation":
        rtype = body.get("type")
        sa = state["sanitation"]
        if rtype in ("opt.toilet", "opt.facility"):
            sa["facility_readiness_pct"] = _clamp(sa["facility_readiness_pct"] - 20)
        elif rtype == "opt.cleanliness":
            sa["cleanliness_pct"] = _clamp(sa["cleanliness_pct"] - 20)

    return state


@app.post("/api/reports")
def submit_report():
    body = request.get_json(force=True, silent=True) or {}
    role = body.get("role")
    location_id = body.get("location_id") or CAMP_TO_LOCATION.get(body.get("camp_id") or "")

    if not role or not location_id or not store.get_location(location_id):
        return jsonify({"error": "role and a resolvable location_id are required"}), 400

    current = store.get_current_state(location_id)
    if current is None:
        current = seed.base_state(datetime.now(timezone.utc))

    updated = _apply_report(current, role, body)
    now_iso = datetime.now(timezone.utc).isoformat()
    updated["timestamp"] = now_iso

    store.append_history(location_id, current.get("timestamp", now_iso), current)
    store.set_current_state(location_id, updated, now_iso)
    store.record_feed_event(location_id, role, now_iso, body)

    try:
        result = _run_analysis(location_id)
    except model_client.ModelServiceError as exc:
        return jsonify({"stored": True, "analysis_error": str(exc)}), 202

    return jsonify({"stored": True, "analysis": result})


@app.get("/api/feed")
def recent_feed():
    limit = min(50, int(request.args.get("limit", 30)))
    return jsonify(store.list_recent_feed_events(limit))


# ── patient registry (Medical page) ─────────────────────────────────────
PATIENT_STATUSES = {"admitted", "discharged", "referred"}


@app.get("/api/patients")
def list_patients():
    return jsonify(store.list_patients())


@app.post("/api/patients")
def register_patient():
    """Register a patient. If the (case/whitespace-insensitive) name matches
    an existing record, that prior history rides along in the response so
    the Medical page can surface it before the doctor proceeds."""
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    prior_history = store.find_patients_by_name(name)

    status = body.get("status") or "admitted"
    if status not in PATIENT_STATUSES:
        status = "admitted"

    age = body.get("age")
    try:
        age = int(age) if str(age or "").strip() else None
    except (TypeError, ValueError):
        age = None

    patient = {
        "id": "P-" + uuid.uuid4().hex[:6].upper(),
        "name": name,
        "age": age,
        "camp_id": body.get("camp_id") or None,
        "condition": (body.get("condition") or "").strip(),
        "status": status,
        "notes": (body.get("notes") or "").strip(),
        "registered_by": body.get("role") or "medical",
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    store.insert_patient(patient)

    return jsonify({"patient": patient, "prior_history": prior_history})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
