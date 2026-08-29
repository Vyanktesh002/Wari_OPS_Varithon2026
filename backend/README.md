# Wari Command Intelligence — Flask backend

The layer between the static frontend (`Wari Project/`) and the model
service (`model_service/`). Owns persistence (SQLite, `wci.db`, created
on first run) and orchestration: it assembles each location's current
state + short history, calls the model service, stores the result, and
serves it as JSON. It never computes risk itself — see
`../MODEL_INTEGRATION.md` for the ownership split this follows.

## Run

You need all three pieces running at once, in separate terminals:

```bash
# 1. Model service (scoring engine) — port 8001
cd model_service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001

# 2. This backend — port 5050
cd backend
python -m pip install -r requirements.txt
python app.py

# 3. The static frontend — port 5510
cd "Wari Project"
python -m http.server 5510
```

Then open `http://localhost:5510/index.html`, sign in as **Wari
Supervisor**, and open the **Intel** tab — it fetches live, real
analysis from the model service through this backend.

If the frontend is served from anywhere other than `127.0.0.1`/`localhost`
on port 5510, set `window.WCI_BACKEND_URL` (see `assets/js/app.js`) before
`app.js` loads, or edit the default in that file.

## What it does

- On first run, seeds a SQLite database with the 15 Palkhi-route
  locations and a starting operational snapshot (+ short synthetic
  history) per location — see `seed.py`. Jejuri's medical camps run hot,
  Lonand carries the Palkhi's current position with rising congestion,
  Natepute has a fresh critical traffic incident — everything else is calm.
- `GET /api/intel` — analyzes (or serves cached analysis for) every
  location and returns an aggregate view for the Supervisor Intel page:
  overall risk/status, merged key factors, resource gaps, emerging
  risks, and priority actions (each tagged with its location), plus a
  `locations_ranked` list — the real per-location model output, worst
  first. Pass `?refresh=1` to force a fresh call to the model service
  instead of serving the last cached result.
- `GET /api/intel/<location_id>` — same, for a single location.
- `POST /api/reports` — what the Records page calls when an authority
  submits an update. Maps the submitted fields onto the affected
  location's operational state (e.g. a police "Route blockage" report
  sets `traffic.route_blocked` and bumps congestion, adds an incident),
  pushes the previous state onto that location's history, and
  re-analyzes it immediately — so the next Intel page load reflects it.
- `GET /api/locations`, `GET /api/health`, `GET /api/feed` (recent
  submitted reports) round out the API.
- `GET /api/patients` / `POST /api/patients` — the Medical page's patient
  registry. Registering checks existing records for a case/whitespace-
  insensitive name match and returns that `prior_history` alongside the
  new record, so the frontend can show a "this patient has been treated
  before" popup before the doctor proceeds. Seeded with the same roster
  the frontend used to mock locally, plus one deliberate repeat visit
  (Ramesh Jadhav) so the duplicate check has something to find immediately.

## Notes

- SQLite stands in for the MySQL store `MODEL_INTEGRATION.md` describes.
  The `store.py` functions are the only place that would need to change
  to swap it for a real MySQL connection later.
- CORS is enabled for all origins (`backend/app.py`, manual headers, no
  `flask-cors` dependency) so the static frontend can call it regardless
  of which port serves the HTML.

## Deploying to Vercel

Everything ships as one Vercel project. `vercel.json` serves
`Wari Project/` as the static site and rewrites `/api/*` to a single
Python function (`api/index.py`) that runs this Flask app. The model
package is called **in-process** rather than over HTTP, so there is no
second service to deploy.

**Import the repo into Vercel and deploy — no settings to change.**
Framework Preset "Other", no build command, Root Directory left at the
repository root. `vercel.json` supplies the rest.

Nothing needs configuring afterwards: the frontend and the API share one
origin, so `config.js` resolves to the deployment's own URL and CORS is
never exercised. The six demo accounts are seeded on first boot.

Environment variables:

| Env var | Effect |
|---|---|
| `POSTGRES_URL` | **Set this.** Injected automatically by Vercel's Postgres integration; without it data is not durable — see below. |
| `WCI_DB_PATH` | SQLite fallback path, used only when no database URL is set. Defaults to `/tmp/wci.db`. |
| `WCI_ALLOWED_ORIGIN` | Only needed if something on another domain calls this API. |
| `OPENAI_API_KEY` | Enables LLM phrasing in the model's summaries; omitted, deterministic phrasing is used. |

### Making data durable (required)

Vercel functions get a read-only filesystem apart from `/tmp`, and `/tmp`
belongs to one instance and is discarded when it goes cold. A SQLite
*file* therefore cannot survive there. Attach a Postgres database and the
problem goes away — `store.py` speaks both, and picks Postgres
automatically whenever a connection URL is present.

1. In your Vercel project: **Storage → Create Database → Postgres**, and
   connect it to the project. Vercel injects `POSTGRES_URL` for you.
2. Redeploy.

That is the whole change — no code edit, no schema to run by hand. On
first boot the tables are created and `seed.py` loads the 15 locations,
the patients and the six accounts. From then on every registration,
report and session is permanent.

`GET /api/health` reports which backend is live:

```json
{"status":"ok","model_service":"ok","database":"postgres"}
```

`"database":"sqlite"` there means no database URL was found and data is
still ephemeral.

**Verify it before you rely on it.** `verify_db.py` exercises every read
and write against whichever database is configured and cleans up after
itself, so it is safe to point at the live one:

```
WCI_DATABASE_URL="postgres://user:pass@host/db?sslmode=require" python verify_db.py
```

Recognised URL variables, in order: `WCI_DATABASE_URL`, `POSTGRES_URL`,
`DATABASE_URL`. Prefer Vercel's `POSTGRES_URL` — it is the *pooled*
endpoint, which matters on serverless, where many short-lived instances
would otherwise exhaust the connection limit. `store.py` also reconnects
once and retries if it wakes to a connection the provider has idled out.

Without a database URL nothing changes locally: `python app.py` still
uses `wci.db` exactly as before.

### Running the model in-process

`MODEL_SERVICE_URL=inprocess` makes `model_client.py` import the model
package and call `analyze()` directly instead of over HTTP. `api/index.py`
sets this automatically.

This exists because Vercel's Hobby plan caps a request at 10 seconds, and
`/api/intel` analyses all 15 locations — one serverless function calling
another over the network would pay a cold start per location and never
finish. In-process the same request takes **~0.25s**, and returns results
byte-identical to the HTTP path (the model is a pure function with no I/O
of its own).

Local development is unaffected: with `MODEL_SERVICE_URL` unset it still
defaults to `http://127.0.0.1:8001`, and the two services run separately
exactly as before.

## Deploying to a host with a persistent disk

Three pieces: the static frontend (`Wari Project/`), this Flask backend,
and the FastAPI model service (`model_service/`). The frontend can go on
any static host; both Python services need a host that runs long-lived
processes and offers a **persistent disk** — the SQLite file must survive
restarts, so a serverless/ephemeral filesystem will silently lose every
patient, user and session.

Deploy in this order, since each step needs the previous URL.

**1. Model service**
```
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**2. This backend**
```
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:$PORT app:app
```
| Env var | Purpose |
|---|---|
| `MODEL_SERVICE_URL` | URL from step 1. Default `http://127.0.0.1:8001`. |
| `WCI_DB_PATH` | Path to `wci.db` **on the persistent disk**. Default is next to `app.py`. |
| `WCI_ALLOWED_ORIGIN` | The frontend's origin, e.g. `https://wari.vercel.app`. Default `*` (fine locally, too open in production). |
| `PORT` | Set by most hosts automatically. Default `5050`. |

**3. Frontend** — serve `Wari Project/` as a static site (that folder is the
site root, not the repo root). Then open
`Wari Project/assets/js/config.js` and set `BACKEND_URL` to step 2's URL.
Leave it empty only if one host serves both the page and this API, in
which case same-origin requests are used automatically.

Nothing needs changing to run locally: with no env vars set and
`BACKEND_URL` empty, everything falls back to the same localhost ports as
before.

## Authentication

Real credential checks live in the `users` / `sessions` tables. Passwords
are stored as PBKDF2-HMAC-SHA256 (200k iterations, per-user random salt) —
never in plaintext — using only the standard library, so no new dependency.

- `POST /api/auth/login` — `{username, password, role}`. Returns a bearer
  `token` plus the account's `role`. The `role` in the body is only the
  tile the user clicked on the login screen; it is checked against the
  account and rejected on mismatch. The account's stored role is what
  actually decides which tabs open.
- `GET /api/auth/me` — validates a bearer token, returns the account.
- `POST /api/auth/logout` — deletes the session server-side.

Sessions expire after 12 hours; expired rows are purged on each login.
Unknown username and wrong password return the same 401 (and do the same
hashing work) so neither can be probed for.

### Demo accounts

Created automatically on boot, one per authority. `insert_user` is
`INSERT OR IGNORE`, so restarting never resets a changed password.

| Username     | Password          | Role                 |
|--------------|-------------------|----------------------|
| `dindi`      | `Dindi@2026`      | Dindi Coordinator    |
| `medical`    | `Medical@2026`    | Medical Authority    |
| `police`     | `Police@2026`     | Police Authority     |
| `municipal`  | `Municipal@2026`  | Municipal Authority  |
| `sanitation` | `Sanitation@2026` | Sanitation Authority |
| `supervisor` | `Supervisor@2026` | Wari Supervisor      |

These are demo credentials in a public repo — rotate them before running
anywhere but a trusted local network. The rest of the API is still
unauthenticated; only the login gate is enforced so far.
