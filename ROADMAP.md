# Garmin Running Dashboard — Implementation Plan

## Context

New personal dashboard to visualize running activities, health metrics, and training load from Garmin Connect. The repo is currently empty. The `python-garminconnect` library handles Garmin API communication and OAuth token management. Data is fetched on-demand (no local database) with in-memory caching to avoid Garmin's aggressive rate limits.

## Stack

- **Backend**: Python 3.12+ / FastAPI / `garminconnect` / `pydantic-settings`
- **Frontend**: TypeScript / React 19 / Vite / TanStack Query / Recharts / Tailwind CSS v4
- **No database** — in-memory TTL cache on the backend, TanStack Query cache on the frontend

## Project Structure

```
RunningDashboard/
├── .env.example          # GARMIN_EMAIL, GARMIN_PASSWORD
├── .gitignore
├── Makefile              # `make dev` runs both backend + frontend
├── CLAUDE.md
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py           # FastAPI app, CORS, lifespan, exception handlers
│       ├── config.py         # pydantic-settings reads .env
│       ├── garmin_client.py  # Singleton Garmin client + TTL cache
│       ├── models.py         # Pydantic response models (optional v1)
│       └── routers/
│           ├── activities.py # /api/activities, /api/activities/{id}/splits
│           ├── health.py     # /api/health/heart-rate, hrv, stress, spo2, sleep
│           └── training.py   # /api/training/readiness, status, max-metrics
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts        # React plugin + Tailwind + proxy to :8000
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # Router setup (3 routes)
│       ├── api/client.ts      # fetch wrapper + TanStack Query hooks
│       ├── types/garmin.ts    # TypeScript interfaces for API responses
│       ├── pages/
│       │   ├── Dashboard.tsx  # Overview: readiness, recent runs, HR, race preds
│       │   ├── Activities.tsx # Activity list + expandable splits
│       │   └── Health.tsx     # Date-selectable HR chart, HRV, stress, sleep
│       └── components/
│           ├── Layout.tsx         # Sidebar nav + Outlet
│           ├── ActivityCard.tsx
│           ├── SplitsTable.tsx
│           ├── MetricCard.tsx     # Reusable label/value card
│           ├── HeartRateChart.tsx  # Recharts LineChart
│           └── TrainingReadiness.tsx
```

## Backend Design

### Auth & Token Management

- Garmin credentials via `.env` file (`GARMIN_EMAIL`, `GARMIN_PASSWORD`), read by `pydantic-settings`
- `garmin_client.py` creates a singleton `Garmin` instance, tries token-based login first (from `~/.garminconnect/`), falls back to email/password
- Tokens auto-persist to disk; full re-login only if refresh token expires
- Garmin client initializes eagerly in FastAPI `lifespan` so first request isn't slow

### In-Memory TTL Cache

`garmin_client.py` maintains a `dict[str, tuple[float, Any]]` cache with per-category TTLs:
- Activities list: 600s
- Daily health metrics (HR, stress, sleep, SpO2): 300s
- Training metrics (VO2max, readiness): 600s
- Activity detail/splits: 3600s (immutable data)

### API Endpoints

**Activities** (`/api/activities`)
| Endpoint | Garmin Method |
|---|---|
| `GET /api/activities?start=0&limit=20` | `get_activities(start, limit, activitytype="running")` |
| `GET /api/activities/{id}` | `get_activity(id)` |
| `GET /api/activities/{id}/splits` | `get_activity_splits(id)` |

**Health** (`/api/health`)
| Endpoint | Garmin Method |
|---|---|
| `GET /api/health/summary?date=` | `get_user_summary(date)` |
| `GET /api/health/heart-rate?date=` | `get_heart_rates(date)` |
| `GET /api/health/hrv?date=` | `get_hrv_data(date)` |
| `GET /api/health/stress?date=` | `get_stress_data(date)` |
| `GET /api/health/spo2?date=` | `get_spo2_data(date)` |
| `GET /api/health/sleep?date=` | `get_sleep_data(date)` |

**Training** (`/api/training`)
| Endpoint | Garmin Method |
|---|---|
| `GET /api/training/max-metrics?date=` | `get_max_metrics(date)` |
| `GET /api/training/readiness?date=` | `get_training_readiness(date)` |
| `GET /api/training/status?date=` | `get_training_status(date)` |

### Key Backend Decisions

- **Sync route handlers** (`def` not `async def`) — `garminconnect` uses blocking I/O; FastAPI auto-runs sync handlers in a threadpool
- **Global exception handler** catches `GarminConnectTooManyRequestsError` → 429, `GarminConnectAuthenticationError` → 401

## Frontend Design

### Data Fetching

TanStack Query manages all server state. Each API call gets a typed hook in `api/client.ts` with appropriate `staleTime`. No manual `useEffect`/`useState` for data fetching.

### Pages

- **Dashboard**: Training readiness (gauge), VO2 max + training status, last 5 runs, resting HR, race predictions. ~5 parallel queries on mount.
- **Activities**: Paginated list of `ActivityCard` components. Click to expand → fetches splits on demand.
- **Health**: Date picker → HR line chart (Recharts), HRV/stress/SpO2/sleep as `MetricCard` grid.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. No PostCSS config needed.

## Implementation Steps

1. **Step 1 — Backend skeleton**: `pyproject.toml`, `config.py`, `main.py` with `GET /api/ping`. Verify uvicorn starts.
2. **Step 2 — Garmin client wrapper**: `garmin_client.py` with login + `get_activities`. Test with curl/Swagger UI.
3. **Step 3 — Activities router**: `/api/activities` and `/api/activities/{id}/splits`.
4. **Step 4 — Frontend skeleton**: Vite + React + Router + TanStack Query. `Dashboard.tsx` fetches and displays activity list. **This validates the full stack end-to-end.**
5. **Step 5 — Health router + Health page**: Health endpoints + HR chart + metric cards.
6. **Step 6 — Training router + Dashboard enrichment**: Training endpoints + full Dashboard overview.
7. **Step 7 — Polish**: Loading states, error boundaries, responsive layout.

## Dev Workflow

```bash
# Backend
cd backend && pip install -e ".[dev]" && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev   # serves at :5173, proxies /api to :8000

# Both at once
make dev
```

Swagger docs at `http://localhost:8000/docs`.

## Verification

- After step 1: `curl http://localhost:8000/api/ping` returns 200
- After step 3: `curl http://localhost:8000/api/activities` returns Garmin running data
- After step 4: Open `http://localhost:5173`, verify activities render in the browser
- After step 6: All three pages functional with real Garmin data
