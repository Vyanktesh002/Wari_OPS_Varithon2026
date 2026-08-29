"""Vercel serverless entrypoint for the Flask backend.

Vercel turns every file under /api into a function and, when a module
exposes a WSGI/ASGI callable named `app`, serves it directly. vercel.json
rewrites every /api/* request here, so the Flask routes ("/api/health",
"/api/auth/login", …) keep their original paths and nothing in app.py has
to change.

Two environment defaults are set before app.py is imported, because it
opens the database at import time:

  WCI_DB_PATH        Only used as a SQLite fallback. With POSTGRES_URL
                     set (Vercel's Postgres integration injects it),
                     store.py ignores this entirely and the data is
                     durable. Without it the app still runs, from a
                     throwaway SQLite file in /tmp — the only writable
                     directory in a Vercel function — which is discarded
                     on every cold start. seed.py repopulates locations,
                     patients and the six accounts on an empty database,
                     so either way a cold start comes up fully working.

  MODEL_SERVICE_URL  "inprocess" makes model_client import the model
                     package and call it directly. One function calling
                     another over HTTP would pay a cold start per
                     location and exceed the request timeout.

Both use setdefault, so a real value configured in the Vercel dashboard
always wins — point WCI_DB_PATH at a hosted database later and this file
needs no edit.
"""
from __future__ import annotations

import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND = os.path.join(_ROOT, "backend")

# app.py imports its siblings flatly (`import store`), so its own directory
# has to come first on the path.
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

os.environ.setdefault("WCI_DB_PATH", "/tmp/wci.db")
os.environ.setdefault("MODEL_SERVICE_URL", "inprocess")

from app import app  # noqa: E402  (path setup must run first)

__all__ = ["app"]
