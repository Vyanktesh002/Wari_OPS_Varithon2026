"""Persistence for the Wari Command Intelligence Flask backend.

Owns: locations, the current operational snapshot per location, a short
rolling history (last 5 ticks) per location, the last analysis result
returned by the model service, the patient registry, and the accounts and
sessions behind the login. No scoring logic lives here — see
model_client.py for the call to the model.

Two backends, one API
---------------------
Every function below behaves identically whichever backend is in use; the
callers (app.py, seed.py) never know which one they are talking to.

  SQLite     — the default. Zero external services: `python app.py` keeps
               working with a local wci.db exactly as it always has.

  PostgreSQL — used automatically when a connection URL is present in the
               environment (see _database_url). Required on serverless
               hosts such as Vercel, where the filesystem is discarded
               between cold starts and a SQLite *file* cannot survive.

The SQL is written once in SQLite's dialect and translated for Postgres
at execution time (_translate). The handful of genuine dialect
differences — AUTOINCREMENT vs BIGSERIAL, INSERT OR IGNORE vs ON CONFLICT
DO NOTHING, and rowid, which Postgres does not have — are branched on
explicitly and commented where they occur.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import threading

_lock = threading.Lock()
_conn = None
_dialect = "sqlite"
_pg_url = ""

HISTORY_LIMIT = 5


# ── backend selection ───────────────────────────────────────────────────
def _database_url() -> str:
    """The Postgres URL, or "" to use SQLite.

    POSTGRES_URL is what Vercel's Postgres and Supabase integrations both
    inject, and is the *pooled* endpoint — the right one for serverless,
    where many short-lived instances would otherwise exhaust the
    connection limit. WCI_DATABASE_URL is checked first so it can
    override; POSTGRES_URL_NON_POOLING is a last resort, better than
    falling back to an ephemeral SQLite file.

    POSTGRES_PRISMA_URL is deliberately ignored: it carries Prisma-only
    query parameters (pgbouncer=true, connect_timeout) that libpq rejects.
    """
    for key in ("WCI_DATABASE_URL", "POSTGRES_URL", "DATABASE_URL", "POSTGRES_URL_NON_POOLING"):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return ""


def dialect() -> str:
    """"sqlite" or "postgres" — for diagnostics (see /api/health)."""
    return _dialect


# ── SQL translation ─────────────────────────────────────────────────────
_NAMED_PARAM = re.compile(r":([a-zA-Z_]\w*)")


def _translate(sql: str) -> str:
    """SQLite placeholders (?, :name) -> psycopg's (%s, %(name)s).

    Named parameters are converted first: they contain no "?", so the
    positional pass afterwards cannot corrupt them. No SQL in this module
    contains a literal "?" or a "::" cast, so both substitutions are safe.
    """
    if _dialect != "postgres":
        return sql
    return _NAMED_PARAM.sub(r"%(\1)s", sql).replace("?", "%s")


def _connect_postgres():
    import psycopg
    from psycopg.rows import dict_row

    # prepare_threshold=None disables psycopg's automatic prepared
    # statements. Managed Postgres is normally reached through a
    # transaction-mode pooler (Supabase's port 6543, PgBouncer, Neon's
    # pooled endpoint), which hands each transaction a different backend
    # session — so a statement prepared on one is missing on the next and
    # the connection starts failing with "prepared statement already
    # exists". The queries here are small and infrequent, so losing the
    # prepared-statement cache costs nothing.
    return psycopg.connect(_pg_url, row_factory=dict_row, prepare_threshold=None)


def _run(sql: str, params=(), *, fetch: str | None = None, commit: bool = False):
    """Execute one statement. fetch: None | "one" | "all"."""
    statement = _translate(sql)

    def execute():
        if _dialect == "postgres":
            with _conn.cursor() as cur:
                cur.execute(statement, params)
                if fetch == "one":
                    return cur.fetchone()
                if fetch == "all":
                    return cur.fetchall()
                return None
        cur = _conn.execute(statement, params)
        if fetch == "one":
            return cur.fetchone()
        if fetch == "all":
            return cur.fetchall()
        return None

    with _lock:
        try:
            result = execute()
        except Exception as exc:
            if _dialect != "postgres" or not _is_connection_error(exc):
                raise
            # Managed Postgres (Neon and friends) drops idle connections, so
            # a warm serverless instance can wake to a dead socket. Reconnect
            # once and retry before surfacing the failure.
            _reconnect_postgres()
            result = execute()
        if commit:
            _conn.commit()
    return result


def _is_connection_error(exc: Exception) -> bool:
    try:
        import psycopg
    except ImportError:  # pragma: no cover - postgres path only
        return False
    return isinstance(exc, (psycopg.OperationalError, psycopg.InterfaceError))


def _reconnect_postgres() -> None:
    global _conn
    try:
        _conn.close()
    except Exception:
        pass
    _conn = _connect_postgres()


def _rows(sql: str, params=()) -> list[dict]:
    return [dict(r) for r in (_run(sql, params, fetch="all") or [])]


def _row(sql: str, params=()) -> dict | None:
    result = _run(sql, params, fetch="one")
    return dict(result) if result else None


def _exec(sql: str, params=()) -> None:
    _run(sql, params, commit=True)


# ── schema ──────────────────────────────────────────────────────────────
def _schema() -> list[str]:
    """One statement per entry, so both backends can run the same list.

    The only differences: the auto-incrementing key, and the explicit
    ordering column Postgres needs because it has no rowid. The SQLite
    schema is left byte-for-byte as it always was, so an existing wci.db
    keeps working with no migration.
    """
    if _dialect == "postgres":
        auto_id = "BIGSERIAL PRIMARY KEY"
        location_order = "seq BIGSERIAL,"
        user_order = "seq BIGSERIAL,"
    else:
        auto_id = "INTEGER PRIMARY KEY AUTOINCREMENT"
        location_order = ""
        user_order = ""

    return [
        f"""
        CREATE TABLE IF NOT EXISTS locations (
            id TEXT PRIMARY KEY,
            {location_order}
            name_en TEXT NOT NULL,
            name_mr TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS location_state (
            location_id TEXT PRIMARY KEY REFERENCES locations(id),
            ts TEXT NOT NULL,
            state_json TEXT NOT NULL
        )
        """,
        f"""
        CREATE TABLE IF NOT EXISTS location_history (
            id {auto_id},
            location_id TEXT NOT NULL REFERENCES locations(id),
            ts TEXT NOT NULL,
            state_json TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS intelligence_results (
            location_id TEXT PRIMARY KEY REFERENCES locations(id),
            analyzed_at TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            status TEXT NOT NULL,
            situation_class TEXT NOT NULL,
            fingerprint TEXT NOT NULL,
            payload_json TEXT NOT NULL
        )
        """,
        f"""
        CREATE TABLE IF NOT EXISTS feed_events (
            id {auto_id},
            location_id TEXT NOT NULL REFERENCES locations(id),
            role TEXT NOT NULL,
            ts TEXT NOT NULL,
            payload_json TEXT NOT NULL
        )
        """,
        """
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
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (name)",
        f"""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            {user_order}
            role TEXT NOT NULL,
            display_name TEXT NOT NULL,
            pass_salt TEXT NOT NULL,
            pass_hash TEXT NOT NULL,
            iterations INTEGER NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            last_login_at TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL REFERENCES users(username),
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (username)",
    ]


def init_db(path: str) -> None:
    """Open the database and ensure the schema exists.

    `path` is the SQLite file, ignored when a Postgres URL is configured.
    """
    global _conn, _dialect, _pg_url

    _pg_url = _database_url()
    if _pg_url:
        _dialect = "postgres"
        _conn = _connect_postgres()
    else:
        _dialect = "sqlite"
        _conn = sqlite3.connect(path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row

    for statement in _schema():
        _exec(statement)


# ── locations ───────────────────────────────────────────────────────────
def is_empty() -> bool:
    return _row("SELECT COUNT(*) AS n FROM locations")["n"] == 0


def upsert_location(location_id: str, name_en: str, name_mr: str) -> None:
    _exec(
        "INSERT INTO locations (id, name_en, name_mr) VALUES (?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET name_en=excluded.name_en, name_mr=excluded.name_mr",
        (location_id, name_en, name_mr),
    )


def list_locations() -> list[dict]:
    # Route order — Alandi first, Pandharpur last — is insertion order.
    order = "seq" if _dialect == "postgres" else "rowid"
    return _rows(f"SELECT id, name_en, name_mr FROM locations ORDER BY {order}")


def get_location(location_id: str) -> dict | None:
    return _row("SELECT id, name_en, name_mr FROM locations WHERE id = ?", (location_id,))


def get_current_state(location_id: str) -> dict | None:
    row = _row("SELECT state_json FROM location_state WHERE location_id = ?", (location_id,))
    return json.loads(row["state_json"]) if row else None


def set_current_state(location_id: str, state: dict, ts: str) -> None:
    _exec(
        "INSERT INTO location_state (location_id, ts, state_json) VALUES (?, ?, ?) "
        "ON CONFLICT(location_id) DO UPDATE SET ts=excluded.ts, state_json=excluded.state_json",
        (location_id, ts, json.dumps(state)),
    )


def append_history(location_id: str, ts: str, state: dict) -> None:
    """Push one tick onto the rolling history, keeping only the last HISTORY_LIMIT."""
    _exec(
        "INSERT INTO location_history (location_id, ts, state_json) VALUES (?, ?, ?)",
        (location_id, ts, json.dumps(state)),
    )
    _exec(
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


def get_history(location_id: str) -> list[dict]:
    """Oldest first, as the model service expects."""
    rows = _rows(
        "SELECT ts, state_json FROM location_history WHERE location_id = ? ORDER BY id ASC",
        (location_id,),
    )
    return [{"timestamp": r["ts"], "state": json.loads(r["state_json"])} for r in rows]


# ── model results ───────────────────────────────────────────────────────
def get_last_intel(location_id: str) -> dict | None:
    row = _row(
        "SELECT risk_score, status, situation_class, fingerprint, payload_json "
        "FROM intelligence_results WHERE location_id = ?",
        (location_id,),
    )
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
    _exec(
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


# ── feed ────────────────────────────────────────────────────────────────
def record_feed_event(location_id: str, role: str, ts: str, payload: dict) -> None:
    _exec(
        "INSERT INTO feed_events (location_id, role, ts, payload_json) VALUES (?, ?, ?, ?)",
        (location_id, role, ts, json.dumps(payload)),
    )


def list_recent_feed_events(limit: int = 30) -> list[dict]:
    rows = _rows(
        "SELECT location_id, role, ts, payload_json FROM feed_events ORDER BY id DESC LIMIT ?",
        (limit,),
    )
    return [
        {"location_id": r["location_id"], "role": r["role"], "ts": r["ts"], **json.loads(r["payload_json"])}
        for r in rows
    ]


# ── patient registry (Medical page) ─────────────────────────────────────
def patients_is_empty() -> bool:
    return _row("SELECT COUNT(*) AS n FROM patients")["n"] == 0


def list_patients() -> list[dict]:
    return _rows("SELECT * FROM patients ORDER BY registered_at DESC")


def find_patients_by_name(name: str) -> list[dict]:
    """Case/whitespace-insensitive match — the duplicate-registration check."""
    return _rows(
        "SELECT * FROM patients WHERE lower(trim(name)) = lower(trim(?)) ORDER BY registered_at DESC",
        (name,),
    )


def insert_patient(patient: dict) -> None:
    _exec(
        "INSERT INTO patients (id, name, age, camp_id, condition, status, notes, registered_by, registered_at) "
        "VALUES (:id, :name, :age, :camp_id, :condition, :status, :notes, :registered_by, :registered_at)",
        patient,
    )


# ── users & sessions (authentication) ───────────────────────────────────
def users_is_empty() -> bool:
    return _row("SELECT COUNT(*) AS n FROM users")["n"] == 0


def insert_user(user: dict) -> None:
    """Idempotent: re-seeding never clobbers an existing account's password."""
    columns = (
        "(username, role, display_name, pass_salt, pass_hash, iterations, active, created_at) "
        "VALUES (:username, :role, :display_name, :pass_salt, :pass_hash, :iterations, 1, :created_at)"
    )
    if _dialect == "postgres":
        sql = f"INSERT INTO users {columns} ON CONFLICT (username) DO NOTHING"
    else:
        sql = f"INSERT OR IGNORE INTO users {columns}"
    _exec(sql, user)


def get_user(username: str) -> dict | None:
    return _row("SELECT * FROM users WHERE lower(trim(username)) = lower(trim(?))", (username,))


def list_users() -> list[dict]:
    order = "seq" if _dialect == "postgres" else "rowid"
    return _rows(
        "SELECT username, role, display_name, active, created_at, last_login_at "
        f"FROM users ORDER BY {order}"
    )


def touch_user_login(username: str, ts: str) -> None:
    _exec("UPDATE users SET last_login_at = ? WHERE username = ?", (ts, username))


def create_session(token: str, username: str, created_at: str, expires_at: str) -> None:
    _exec(
        "INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, username, created_at, expires_at),
    )


def get_session(token: str) -> dict | None:
    """Returns the session joined to its user, or None if unknown."""
    return _row(
        "SELECT s.token, s.username, s.expires_at, u.role, u.display_name, u.active "
        "FROM sessions s JOIN users u ON u.username = s.username WHERE s.token = ?",
        (token,),
    )


def delete_session(token: str) -> None:
    _exec("DELETE FROM sessions WHERE token = ?", (token,))


def purge_expired_sessions(now_iso: str) -> None:
    _exec("DELETE FROM sessions WHERE expires_at < ?", (now_iso,))
