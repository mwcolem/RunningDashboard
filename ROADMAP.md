# Garmin Running Dashboard — Implementation Plan

## Context

Personal dashboard to visualize running activities, health metrics, and training load from Garmin Connect. The `python-garminconnect` library handles Garmin API communication and OAuth token management. Data is fetched on-demand (no local database) with in-memory caching to avoid Garmin's aggressive rate limits.

## Stack

- **Backend**: Python 3.12+ / FastAPI / `garminconnect` / `pydantic-settings`
- **Frontend**: TypeScript / React 19 / Vite / TanStack Query / Recharts / Tailwind CSS v4
- **No database** — in-memory TTL cache on the backend, TanStack Query cache on the frontend

## Project Structure

```
RunningDashboard/
├── .env.example          # GARMIN_EMAIL, GARMIN_PASSWORD
├── .env                  # not committed
├── .gitignore
├── Makefile              # `make dev` runs both backend + frontend
├── CLAUDE.md
├── ROADMAP.md
├── README.md
├── backend/
│   ├── pyproject.toml
│   ├── .venv/
│   └── app/
│       ├── main.py           # FastAPI app, CORS, lifespan, exception handlers
│       ├── config.py         # pydantic-settings reads .env
│       ├── garmin_client.py  # Singleton Garmin client + TTL cache
│       └── routers/
│           ├── activities.py # /api/activities, /api/activities/{id}, /api/activities/{id}/splits
│           ├── health.py     # /api/health/* (heart-rate, hrv, stress, spo2, sleep, summary, body-battery)
│           └── training.py   # /api/training/* — Step 6
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts        # React plugin + Tailwind + proxy to :8001
│   ├── index.html
│   └── src/
│       ├── main.tsx           # QueryClientProvider root
│       ├── App.tsx            # BrowserRouter + 3 routes
│       ├── index.css          # Tailwind import
│       ├── api/client.ts      # fetch wrapper + TanStack Query hooks
│       ├── types/garmin.ts    # TypeScript interfaces for API responses
│       ├── pages/
│       │   ├── Dashboard.tsx  # Last 10 runs (distance, pace, duration, HR)
│       │   ├── Activities.tsx # Stub — Step 6
│       │   └── Health.tsx     # Date picker, HR chart, metric cards, sleep breakdown
│       └── components/
│           ├── Layout.tsx         # Sidebar nav + Outlet
│           ├── MetricCard.tsx     # Reusable label/value card
│           └── HeartRateChart.tsx # Recharts LineChart with downsampling
```

## Backend Design

### Auth & Token Management

- Garmin credentials via `.env` file (`GARMIN_EMAIL`, `GARMIN_PASSWORD`), read by `pydantic-settings`
- `garmin_client.py` creates a singleton `Garmin` instance, tries token-based login first (from `~/.garminconnect/`), falls back to email/password
- Tokens auto-persist to disk; full re-login only if refresh token expires
- Garmin client initializes in FastAPI `lifespan` — failure is non-fatal (logs warning, retries on first request)

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
| `GET /api/health/body-battery?date=` | `get_body_battery(date)` |

**Training** (`/api/training`) — Step 6
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

- **Dashboard**: Last 10 runs with distance, pace, duration, HR. Will gain training readiness and race predictions in Step 6.
- **Activities**: Stub — paginated activity list with expandable splits coming in Step 6.
- **Health**: Date picker → HR line chart (Recharts), HRV/stress/SpO2/sleep metric cards, sleep stage breakdown.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. No PostCSS config needed.

## Implementation Steps

1. ✅ **Step 1 — Backend skeleton**: `pyproject.toml`, `config.py`, `main.py` with `GET /api/ping`.
2. ✅ **Step 2 — Garmin client wrapper**: `garmin_client.py` with singleton login + TTL cache + activities functions. Activities router wired up.
3. ✅ **Step 3 — Activities router**: Done as part of Step 2.
4. ✅ **Step 4 — Frontend skeleton**: Vite + React + Router + TanStack Query. Dashboard shows recent runs end-to-end.
5. ✅ **Step 5 — Health router + Health page**: Health endpoints + HR chart + metric cards + sleep breakdown.
6. **Step 6 — Training router + Dashboard enrichment**: Training endpoints, training readiness/VO2 max on Dashboard, full Activities page with expandable splits.
7. **Step 7 — Polish**: Loading skeletons, error boundaries, responsive layout.

## Dev Workflow

```bash
# Backend
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend && npm run dev   # serves at :5174, proxies /api to :8001

# Both at once
make dev
```

Swagger docs at `http://localhost:8001/docs`.

## Verification

- Steps 1–5 complete: `curl http://localhost:8001/api/ping`, `/api/activities`, `/api/health/heart-rate` all return data
- Open `http://localhost:5174` — Dashboard shows recent runs, Health page shows HR chart and metric cards
- After Step 6: All three pages fully functional with real Garmin data
