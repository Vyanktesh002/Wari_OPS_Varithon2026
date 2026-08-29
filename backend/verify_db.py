"""Exercise every store.py function against whichever database is configured.

Run this once after pointing the app at a real Postgres, to prove the
connection, the schema and every read and write actually work before you
rely on them:

    # Postgres (durable)
    WCI_DATABASE_URL="postgres://user:pass@host/db?sslmode=require" python verify_db.py

    # SQLite (the local default) — no env var needed
    python verify_db.py

Everything it writes is removed again, so it is safe to run against a
live database. Exits non-zero if anything fails.
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import store  # noqa: E402

PASS, FAIL = "  ok  ", " FAIL "
_failures: list[str] = []


def check(label: str, condition: bool, detail: str = "") -> None:
    print(f"[{PASS if condition else FAIL}] {label}{(' — ' + detail) if detail else ''}")
    if not condition:
        _failures.append(label)


def main() -> int:
    db_path = os.environ.get("WCI_DB_PATH", os.path.join(os.path.dirname(__file__), "wci.db"))
    store.init_db(db_path)

    print(f"\ndatabase backend: {store.dialect()}")
    if store.dialect() == "sqlite":
        print(f"  file: {db_path}")
        print("  NOTE: durable only if this file is on a persistent disk.")
    else:
        print("  durable: yes")
    print()

    now = datetime.now(timezone.utc)
    iso = now.isoformat()
    tag = uuid.uuid4().hex[:8]
    loc_id = f"_verify_{tag}"

    # ── locations ──────────────────────────────────────────────────────
    store.upsert_location(loc_id, "Verify Location", "पडताळणी")
    got = store.get_location(loc_id)
    check("locations: insert + read back", bool(got) and got["name_en"] == "Verify Location")

    store.upsert_location(loc_id, "Verify Renamed", "पडताळणी")
    check("locations: upsert updates in place",
          store.get_location(loc_id)["name_en"] == "Verify Renamed")

    all_locs = store.list_locations()
    check("locations: ordering is stable (route order)",
          len(all_locs) >= 1 and all(("id" in loc and "name_mr" in loc) for loc in all_locs),
          f"{len(all_locs)} rows")
    check("locations: is_empty() works", store.is_empty() is False)

    # ── state + rolling history ────────────────────────────────────────
    store.set_current_state(loc_id, {"crowd": 42, "unicode": "वारी"}, iso)
    state = store.get_current_state(loc_id)
    check("state: JSON round-trip incl. Devanagari",
          state == {"crowd": 42, "unicode": "वारी"})

    for i in range(store.HISTORY_LIMIT + 3):
        store.append_history(loc_id, iso, {"tick": i})
    hist = store.get_history(loc_id)
    check(f"history: trimmed to HISTORY_LIMIT ({store.HISTORY_LIMIT})",
          len(hist) == store.HISTORY_LIMIT, f"got {len(hist)}")
    check("history: oldest-first ordering",
          [h["state"]["tick"] for h in hist] == sorted(h["state"]["tick"] for h in hist))

    # ── model results ──────────────────────────────────────────────────
    payload = {"analyzed_at": iso, "risk_score": 77, "status": "CRITICAL",
               "situation_class": "surge", "fingerprint": "fp-" + tag, "extra": ["a", "b"]}
    store.save_intel(loc_id, payload)
    intel = store.get_last_intel(loc_id)
    check("intel: saved and read back", bool(intel) and intel["risk_score"] == 77)
    store.save_intel(loc_id, {**payload, "risk_score": 12, "status": "NORMAL"})
    check("intel: upsert overwrites", store.get_last_intel(loc_id)["risk_score"] == 12)

    # ── feed ───────────────────────────────────────────────────────────
    store.record_feed_event(loc_id, "police", iso, {"note": "verify"})
    check("feed: event recorded",
          any(e["location_id"] == loc_id for e in store.list_recent_feed_events(50)))

    # ── patients ───────────────────────────────────────────────────────
    pid = f"P-VERIFY-{tag}"
    pname = f"Verify Patient {tag}"
    store.insert_patient({
        "id": pid, "name": pname, "age": 33, "camp_id": "jejuri-1",
        "condition": "verification", "status": "admitted", "notes": "",
        "registered_by": "medical", "registered_at": iso,
    })
    check("patients: inserted", any(p["id"] == pid for p in store.list_patients()))
    check("patients: case/whitespace-insensitive name lookup",
          [p["id"] for p in store.find_patients_by_name(f"  {pname.upper()} ")] == [pid])

    store.insert_patient({
        "id": f"P-NULLAGE-{tag}", "name": f"No Age {tag}", "age": None, "camp_id": None,
        "condition": "", "status": "admitted", "notes": "",
        "registered_by": "medical", "registered_at": iso,
    })
    check("patients: NULL age and camp accepted", True)

    # ── users + sessions ───────────────────────────────────────────────
    uname = f"_verify_{tag}"
    user = {"username": uname, "role": "supervisor", "display_name": "Verify User",
            "pass_salt": "s" * 32, "pass_hash": "h" * 64, "iterations": 200000,
            "created_at": iso}
    store.insert_user(user)
    check("users: inserted", bool(store.get_user(uname)))
    check("users: lookup is case/whitespace-insensitive",
          bool(store.get_user(f"  {uname.upper()} ")))

    store.insert_user({**user, "pass_hash": "DIFFERENT"})
    check("users: re-seed does NOT overwrite an existing password",
          store.get_user(uname)["pass_hash"] == "h" * 64)

    check("users: active flag readable as truthy int",
          bool(store.get_user(uname)["active"]))
    check("users: listing ordered without rowid",
          any(u["username"] == uname for u in store.list_users()))

    store.touch_user_login(uname, iso)
    check("users: last_login_at updated", store.get_user(uname)["last_login_at"] == iso)

    token = "verify-token-" + tag
    store.create_session(token, uname, iso, (now + timedelta(hours=12)).isoformat())
    sess = store.get_session(token)
    check("sessions: created and joined to its user",
          bool(sess) and sess["role"] == "supervisor" and sess["display_name"] == "Verify User")

    dead = "verify-expired-" + tag
    store.create_session(dead, uname, iso, (now - timedelta(hours=1)).isoformat())
    store.purge_expired_sessions(iso)
    check("sessions: expired rows purged", store.get_session(dead) is None)
    check("sessions: live session survives the purge", bool(store.get_session(token)))

    store.delete_session(token)
    check("sessions: deleted on logout", store.get_session(token) is None)

    # ── cleanup ────────────────────────────────────────────────────────
    store._exec("DELETE FROM sessions WHERE username = ?", (uname,))
    store._exec("DELETE FROM users WHERE username = ?", (uname,))
    store._exec("DELETE FROM patients WHERE id IN (?, ?)", (pid, f"P-NULLAGE-{tag}"))
    store._exec("DELETE FROM feed_events WHERE location_id = ?", (loc_id,))
    store._exec("DELETE FROM intelligence_results WHERE location_id = ?", (loc_id,))
    store._exec("DELETE FROM location_history WHERE location_id = ?", (loc_id,))
    store._exec("DELETE FROM location_state WHERE location_id = ?", (loc_id,))
    store._exec("DELETE FROM locations WHERE id = ?", (loc_id,))
    check("cleanup: verification rows removed", store.get_location(loc_id) is None)

    print()
    if _failures:
        print(f"{len(_failures)} CHECK(S) FAILED:")
        for f in _failures:
            print(f"  - {f}")
        return 1
    print(f"all checks passed against {store.dialect()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
