"""SQLite persistence for the Wari Command Intelligence Flask backend.

Owns: locations, the current operational snapshot per location, a short
rolling history (last 5 ticks) per location, and the last analysis result
returned by the model service. No scoring logic lives here — see
model_client.py for the call to POST /model/analyze.

A real deployment would swap this for MySQL (per MODEL_INTEGRATION.md);
SQLite keeps this runnable with zero external services for local/dev use.
"""
from __future__ import annotations

import json
import sqlite3
import threading

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None

HISTORY_LIMIT = 5


def init_db(path: str) -> None:
    global _conn
    _conn = sqlite3.connect(path, check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    with _lock:
        _conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS locations (
                id TEXT PRIMARY KEY,
                name_en TEXT NOT NULL,
                name_mr TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS location_state (
                location_id TEXT PRIMARY KEY REFERENCES locations(id),
                ts TEXT NOT NULL,
                state_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS location_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL REFERENCES locations(id),
                ts TEXT NOT NULL,
                state_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS intelligence_results (
                location_id TEXT PRIMARY KEY REFERENCES locations(id),
                analyzed_at TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                status TEXT NOT NULL,
                situation_class TEXT NOT NULL,
                fingerprint TEXT NOT NULL,
                payload_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS feed_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id TEXT NOT NULL REFERENCES locations(id),
                role TEXT NOT NULL,
                ts TEXT NOT NULL,
                payload_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER,
                camp_id TEXT,
                condition TEXT,
                status TEXT NOT NULL,
                notes TEXT,
                registered_by TEXT,
                registered_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (name);
            """
        )
        _conn.commit()


def is_empty() -> bool:
    with _lock:
        row = _conn.execute("SELECT COUNT(*) AS n FROM locations").fetchone()
    return row["n"] == 0


def upsert_location(location_id: str, name_en: str, name_mr: str) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO locations (id, name_en, name_mr) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET name_en=excluded.name_en, name_mr=excluded.name_mr",
            (location_id, name_en, name_mr),
        )
        _conn.commit()


def list_locations() -> list[dict]:
    with _lock:
        rows = _conn.execute("SELECT id, name_en, name_mr FROM locations ORDER BY rowid").fetchall()
    return [{"id": r["id"], "name_en": r["name_en"], "name_mr": r["name_mr"]} for r in rows]


def get_location(location_id: str) -> dict | None:
    with _lock:
        row = _conn.execute(
            "SELECT id, name_en, name_mr FROM locations WHERE id = ?", (location_id,)
        ).fetchone()
    return {"id": row["id"], "name_en": row["name_en"], "name_mr": row["name_mr"]} if row else None


def get_current_state(location_id: str) -> dict | None:
    with _lock:
        row = _conn.execute(
            "SELECT state_json FROM location_state WHERE location_id = ?", (location_id,)
        ).fetchone()
    return json.loads(row["state_json"]) if row else None


def set_current_state(location_id: str, state: dict, ts: str) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO location_state (location_id, ts, state_json) VALUES (?, ?, ?) "
            "ON CONFLICT(location_id) DO UPDATE SET ts=excluded.ts, state_json=excluded.state_json",
            (location_id, ts, json.dumps(state)),
        )
        _conn.commit()


def append_history(location_id: str, ts: str, state: dict) -> None:
    """Push one tick onto the rolling history, keeping only the last HISTORY_LIMIT."""
    with _lock:
        _conn.execute(
            "INSERT INTO location_history (location_id, ts, state_json) VALUES (?, ?, ?)",
            (location_id, ts, json.dumps(state)),
        )
        _conn.execute(
            """
            DELETE FROM location_history
            WHERE location_id = ? AND id NOT IN (
                SELECT id FROM location_history
                WHERE location_id = ?
                ORDER BY id DESC LIMIT ?
            )
            """,
            (location_id, location_id, HISTORY_LIMIT),
        )
        _conn.commit()


def get_history(location_id: str) -> list[dict]:
    """Oldest first, as the model service expects."""
    with _lock:
        rows = _conn.execute(
            "SELECT ts, state_json FROM location_history WHERE location_id = ? ORDER BY id ASC",
            (location_id,),
        ).fetchall()
    return [{"timestamp": r["ts"], "state": json.loads(r["state_json"])} for r in rows]


def get_last_intel(location_id: str) -> dict | None:
    with _lock:
        row = _conn.execute(
            "SELECT risk_score, status, situation_class, fingerprint, payload_json "
            "FROM intelligence_results WHERE location_id = ?",
            (location_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "risk_score": row["risk_score"],
        "status": row["status"],
        "situation_class": row["situation_class"],
        "fingerprint": row["fingerprint"],
        "payload": json.loads(row["payload_json"]),
    }


def save_intel(location_id: str, payload: dict) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO intelligence_results "
            "(location_id, analyzed_at, risk_score, status, situation_class, fingerprint, payload_json) "
            "VALUES (?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(location_id) DO UPDATE SET "
            "analyzed_at=excluded.analyzed_at, risk_score=excluded.risk_score, "
            "status=excluded.status, situation_class=excluded.situation_class, "
            "fingerprint=excluded.fingerprint, payload_json=excluded.payload_json",
            (
                location_id,
                payload["analyzed_at"],
                payload["risk_score"],
                payload["status"],
                payload["situation_class"],
                payload["fingerprint"],
                json.dumps(payload),
            ),
        )
        _conn.commit()


def record_feed_event(location_id: str, role: str, ts: str, payload: dict) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO feed_events (location_id, role, ts, payload_json) VALUES (?, ?, ?, ?)",
            (location_id, role, ts, json.dumps(payload)),
        )
        _conn.commit()


def list_recent_feed_events(limit: int = 30) -> list[dict]:
    with _lock:
        rows = _conn.execute(
            "SELECT location_id, role, ts, payload_json FROM feed_events ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [
        {"location_id": r["location_id"], "role": r["role"], "ts": r["ts"], **json.loads(r["payload_json"])}
        for r in rows
    ]


# ── patient registry (Medical page) ─────────────────────────────────────
def patients_is_empty() -> bool:
    with _lock:
        row = _conn.execute("SELECT COUNT(*) AS n FROM patients").fetchone()
    return row["n"] == 0


def list_patients() -> list[dict]:
    with _lock:
        rows = _conn.execute("SELECT * FROM patients ORDER BY registered_at DESC").fetchall()
    return [dict(r) for r in rows]


def find_patients_by_name(name: str) -> list[dict]:
    """Case/whitespace-insensitive match — the duplicate-registration check."""
    with _lock:
        rows = _conn.execute(
            "SELECT * FROM patients WHERE lower(trim(name)) = lower(trim(?)) ORDER BY registered_at DESC",
            (name,),
        ).fetchall()
    return [dict(r) for r in rows]


def insert_patient(patient: dict) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO patients (id, name, age, camp_id, condition, status, notes, registered_by, registered_at) "
            "VALUES (:id, :name, :age, :camp_id, :condition, :status, :notes, :registered_by, :registered_at)",
            patient,
        )
        _conn.commit()
