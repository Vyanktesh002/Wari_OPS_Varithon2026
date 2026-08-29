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
- There's no auth here, matching the frontend's own prototype login
  ("any credentials are accepted"). Don't expose this outside a trusted
  network as-is.
