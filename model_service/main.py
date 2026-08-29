"""Standalone Wari Command Intelligence model service."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from intel import analyze
from schemas import AnalyzeRequest, AnalyzeResponse
from config import get_config

app = FastAPI(
    title="Wari Command Intelligence Model Service",
    version=get_config()["model_version"],
    description=(
        "Deterministic operational intelligence for one Wari location. "
        "Does not access a database, frontend, or Flask app."
    ),
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "wari-model", "version": get_config()["model_version"]}


@app.post("/model/analyze", response_model=AnalyzeResponse)
def model_analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    return analyze(payload)


@app.exception_handler(ValueError)
async def value_error_handler(_request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})
