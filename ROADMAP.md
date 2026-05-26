# Garmin Running Dashboard — Implementation Roadmap

## Context

Personal dashboard to visualize running activities, health metrics, and training load from Garmin Connect. The `python-garminconnect` library handles Garmin API communication and OAuth token management. Data is fetched on-demand (no local database) with in-memory caching to avoid Garmin's aggressive rate limits.

## Stack

- **Backend**: Python 3.12+ / FastAPI / `garminconnect` / `pydantic-settings`
- **Frontend**: TypeScript / React 19 / Vite / TanStack Query / Recharts / Tailwind CSS v4
- **No database** — in-memory TTL cache on the backend, TanStack Query cache on the frontend

## Project Structure

```
RunningDashboard/
├── .env.example
├── .env                  # not committed
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml        # pytest + mypy (backend) + tsc (frontend)
├── Makefile              # `make dev` runs both backend + frontend
├── goals.json            # local mileage goal config (not committed)
├── CLAUDE.md
├── ROADMAP.md
├── README.md
├── backend/
│   ├── pyproject.toml
│   ├── .venv/
│   ├── tests/
│   │   ├── conftest.py       # TestClient fixture with mocked Garmin client
│   │   ├── test_ping.py
│   │   └── test_stats.py
│   └── app/
│       ├── main.py           # FastAPI app, CORS, lifespan, exception handlers
│       ├── config.py         # pydantic-settings reads .env
│       ├── garmin_client.py  # Singleton Garmin client + TTL cache
│       └── routers/
│           ├── activities.py # /api/activities, /api/activities/{id}/splits
│           ├── gear.py       # /api/gear/shoes
│           ├── health.py     # /api/health/* (7 endpoints)
│           ├── stats.py      # /api/stats/mileage, /api/stats/goals
│           └── training.py   # /api/training/* (4 endpoints)
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts        # React plugin + Tailwind + proxy to :8001
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # BrowserRouter + 4 routes
│       ├── index.css
│       ├── api/client.ts      # fetch wrapper + TanStack Query hooks
│       ├── types/garmin.ts    # TypeScript interfaces for API responses
│       ├── pages/
│       │   ├── Dashboard.tsx  # Readiness, VO2 max, mileage, goals, recent shoes, race predictions
│       │   ├── Activities.tsx # Paginated activity list with expandable splits
│       │   ├── Gear.tsx       # Shoe mileage tracker
│       │   └── Health.tsx     # Date picker, HR chart, metric cards, sleep breakdown
│       └── components/
│           ├── Layout.tsx         # Desktop sidebar + mobile bottom nav + ErrorBoundary
│           ├── ActivityCard.tsx   # Expandable card — fetches splits on click
│           ├── GoalBar.tsx        # Mileage goal progress bar with remaining display
│           ├── SplitsTable.tsx    # Lap table (pace in min/mi, distance in mi, HR, elevation)
│           ├── MetricCard.tsx     # Reusable label/value card
│           ├── HeartRateChart.tsx # Recharts LineChart with downsampling
│           ├── Skeleton.tsx       # Skeleton, SkeletonCard, SkeletonRow, SkeletonChart
│           └── ErrorBoundary.tsx  # React error boundary wrapping page Outlet
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
- Gear/shoes: 3600s

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

**Training** (`/api/training`)
| Endpoint | Garmin Method |
|---|---|
| `GET /api/training/max-metrics?date=` | `get_max_metrics(date)` |
| `GET /api/training/readiness?date=` | `get_training_readiness(date)` |
| `GET /api/training/status?date=` | `get_training_status(date)` |
| `GET /api/training/race-predictions` | `get_race_predictions()` |

**Stats** (`/api/stats`)
| Endpoint | Notes |
|---|---|
| `GET /api/stats/mileage` | Year/month/week totals in miles from YTD activity scan |
| `GET /api/stats/goals` | Reads `goals.json`, joins with mileage data |

**Gear** (`/api/gear`)
| Endpoint | Notes |
|---|---|
| `GET /api/gear/shoes` | Active shoes with stats + last_used from recent activity scan |

### Key Backend Decisions

- **Sync route handlers** (`def` not `async def`) — `garminconnect` uses blocking I/O; FastAPI auto-runs sync handlers in a threadpool
- **Global exception handler** catches `GarminConnectTooManyRequestsError` → 429, `GarminConnectAuthenticationError` → 401
- **Goals via local config** — Garmin's `/goal-service/goal/goals` API returns empty for app-set goals; `goals.json` at project root is the source of truth
- **Gear last-used** — `get_shoes()` calls `get_activity_gear(id)` for up to 30 recent runs to find the most recent date each shoe was worn

## Frontend Design

### Data Fetching

TanStack Query manages all server state. Each API call gets a typed hook in `api/client.ts` with appropriate `staleTime`. No manual `useEffect`/`useState` for data fetching.

### Pages

- **Dashboard**: Readiness score (color-coded), VO2 max, training status, mileage summary (week/month/year), goals with remaining mileage, last 2 shoes used (with progress bars), race predictions.
- **Activities**: Paginated list (20/page) of `ActivityCard` components. Click to expand → fetches and shows `SplitsTable` on demand. All distances/paces in miles.
- **Gear**: Active shoes sorted by most recently used. Each card shows name, make/model, total miles, progress bar toward retirement limit (blue → orange at 80% → red at/over limit), last run date, activity count.
- **Health**: Date picker → HR line chart (Recharts), HRV/stress/SpO2/sleep metric cards, sleep stage breakdown. Each metric skeletons independently.

### Styling & Responsiveness

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Desktop: sidebar nav. Mobile: fixed bottom nav, pace/HR stats hidden on small screens to prevent overflow.

## Implementation Steps

1. ✅ **Backend skeleton** — `pyproject.toml`, `config.py`, `main.py` with `GET /api/ping`.
2. ✅ **Garmin client wrapper** — `garmin_client.py` with singleton login + TTL cache.
3. ✅ **Activities router** — `/api/activities` and splits endpoint.
4. ✅ **Frontend skeleton** — Vite + React + Router + TanStack Query. Full stack validated end-to-end.
5. ✅ **Health router + Health page** — 7 health endpoints, HR chart, metric cards, sleep breakdown.
6. ✅ **Training router + Dashboard** — Readiness, VO2 max, training status, race predictions.
7. ✅ **Polish** — Skeleton loading states, ErrorBoundary, responsive layout.
8. ✅ **Mileage + Goals** — `/api/stats/mileage`, `/api/stats/goals`, GoalBar component, local `goals.json` config.
9. ✅ **Gear / Shoe tracker** — `/api/gear/shoes`, Gear page, last-used detection via activity gear scan, Recent Shoes panel on Dashboard.
10. ✅ **CI** — GitHub Actions: pytest + mypy (backend), tsc (frontend). Tests mock Garmin client; no credentials needed in CI.

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
