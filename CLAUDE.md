# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

See `ROADMAP.md` for the full implementation plan (backend API, React dashboard, implementation order).

RunningDashboard is a personal Garmin Connect dashboard with a Python/FastAPI backend and TypeScript/React frontend. It uses the [garminconnect](https://pypi.org/project/garminconnect/) library to pull running activities, health metrics, and training load data on-demand.

## Setup

Credentials are read from `.env` at the project root via `pydantic-settings`:

```env
GARMIN_EMAIL=your@email.com
GARMIN_PASSWORD=yourpassword
```

OAuth tokens are cached by the garminconnect library at `~/.garminconnect/garmin_tokens.json`. The library tries token-based login first; full SSO re-login only happens when the refresh token expires.

Backend:
```bash
cd backend && pip install -e ".[dev]"
```

Frontend:
```bash
cd frontend && npm install
```

## Running

```bash
# Backend (port 8001, auto-reload)
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8001

# Frontend (port 5174, proxies /api to :8001)
cd frontend && npm run dev

# Both at once
make dev
```

Swagger docs at `http://localhost:8001/docs`.

## Development

```bash
cd backend && .venv/bin/pytest tests/
cd backend && .venv/bin/mypy app/
cd backend && .venv/bin/ruff check app/
```

## Architecture

### Module roles

- **`backend/app/main.py`** — FastAPI app with lifespan (attempts Garmin login on startup, logs warning and continues if it fails), CORS middleware, and global exception handlers (`GarminConnectTooManyRequestsError` → 429, `GarminConnectAuthenticationError` → 401).
- **`backend/app/config.py`** — `pydantic-settings` reads `.env` for `GARMIN_EMAIL`, `GARMIN_PASSWORD`, `CACHE_TTL_SECONDS`, `CORS_ORIGINS`.
- **`backend/app/garmin_client.py`** — Singleton Garmin client wrapper with in-memory TTL cache (`dict[str, tuple[float, Any]]`). All Garmin API calls go through here. Cache TTLs: activities list 600s, daily health metrics 300s, training metrics 600s, activity detail/splits 3600s (immutable).
- **`backend/app/routers/activities.py`** — `/api/activities` (paginated, filtered to running), `/api/activities/{id}`, `/api/activities/{id}/splits`.
- **`backend/app/routers/health.py`** — `/api/health/heart-rate`, `/api/health/hrv`, `/api/health/stress`, `/api/health/spo2`, `/api/health/sleep`, `/api/health/summary`, `/api/health/body-battery`. All accept `?date=YYYY-MM-DD`, default to today.
- **`backend/app/routers/training.py`** — Not yet implemented (Step 6). Will cover `/api/training/readiness`, `/api/training/status`, `/api/training/max-metrics`.
- **`frontend/src/api/client.ts`** — Fetch wrapper and TanStack Query hooks with typed responses. All server state flows through here.
- **`frontend/src/types/garmin.ts`** — TypeScript interfaces for all API response shapes.
- **`frontend/src/components/Layout.tsx`** — Sidebar nav + `<Outlet />` shell.
- **`frontend/src/components/MetricCard.tsx`** — Reusable label/value card used throughout Health page.
- **`frontend/src/components/HeartRateChart.tsx`** — Recharts `LineChart` with downsampling to ~200 points.
- **`frontend/src/pages/Dashboard.tsx`** — Last 10 runs with distance, pace, duration, and HR.
- **`frontend/src/pages/Activities.tsx`** — Stub (Step 6).
- **`frontend/src/pages/Health.tsx`** — Date picker, HR line chart, HRV/stress/SpO2/sleep metric grid, sleep stage breakdown.

### Key design details

- **Sync route handlers**: `garminconnect` uses blocking I/O. Route handlers use `def` not `async def` — FastAPI auto-runs them in a threadpool.
- **Rate limit defense**: Garmin has aggressive 429 rate limits on SSO endpoints. The in-memory TTL cache in `garmin_client.py` is the primary defense. The lifespan login failure is non-fatal — the server starts and retries on first request.
- **No database**: Data is fetched on-demand from Garmin. Backend caches in-memory (TTL dict), frontend caches via TanStack Query `staleTime`. No local persistence beyond OAuth tokens.
- **Vite proxy**: `vite.config.ts` proxies `/api` requests to `http://localhost:8001`. CORS middleware on the backend is also configured as a fallback.
- **No user-facing auth**: This is a personal localhost dashboard. No auth between frontend and backend.
