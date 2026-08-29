# Wari Command Intelligence — Model Service

Standalone FastAPI service that turns **current Wari state + recent 3–5 history ticks** into supervisor intelligence.

It does **not** talk to MySQL, Supabase, Flask, or any frontend. Risk, status, gaps, and actions are **deterministic**. An LLM may only rephrase `situation_summary` when explicitly requested.

## Run

```bash
cd model_service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

OpenAPI: `http://127.0.0.1:8001/docs`

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/model/analyze` | Intelligence for one location |

See `../MODEL_INTEGRATION.md` for the Flask contract.

## Tests

```bash
cd model_service
python -m pytest -q
```

## Optional LLM phrasing

Set `OPENAI_API_KEY` and send `"options": {"use_llm_phrasing": true}`. Scores and decisions never use the LLM. If the call fails, the deterministic summary is returned.
