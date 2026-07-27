# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

**Never commit or push directly to `master`.** Always work on a feature branch. Before staging any changes, verify the current branch with `git branch` and switch to (or create) a feature branch if on `master`.

**Never merge pull requests.** Open PRs for review, but never call `gh pr merge` or any equivalent. The user always reviews and merges manually.

## PR conventions

- One change = one branch = one PR. Branch off fresh `origin/master`. Ship the minimum diff that completes the task.
- Adjacent problems you notice get one sentence in the PR body — never a fix folded into the same branch.
- If the task embeds an owner decision (a threshold, a scope call, a product behavior), ask before implementing; don't pick a side silently.
- Stage files by name only — never `git add -A`. Never stage untracked files you didn't create.
- Commit message: imperative one-line summary, then a short body with the what and the why.
- PR body: `## Summary` bullets of behavior changes, a scope line (files touched, +/−), test evidence, and anything explicitly out of scope.
- After opening, poll CI and report the result honestly, failures included.

## Overview

RunningDashboard is a personal Garmin Connect dashboard with a Python/FastAPI backend and TypeScript/React frontend. It uses the [garminconnect](https://pypi.org/project/garminconnect/) library to pull running activities, health metrics, training load, and gear data on-demand. See `ROADMAP.md` for full implementation history.

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

CI runs pytest + mypy on every push/PR via `.github/workflows/ci.yml`. A parallel job runs `npx tsc --noEmit` in `frontend/`.

## Pre-PR checklist

Before marking any effort complete and opening a PR, run all of the following:

```bash
# Backend — from backend/
cd backend
.venv/bin/ruff check app/
.venv/bin/mypy app/
.venv/bin/pytest tests/

# Frontend — from frontend/
cd ../frontend
npm run lint
npm run build
```

`npm run build` (`tsc -b && vite build`) is the **only** real frontend type gate. `tsconfig.json` is a solution file (`files: []` + project references), so the CI job's `npx tsc --noEmit` type-checks zero files and passes vacuously — `tsc -b` is what actually compiles `tsconfig.app.json` and the 22 files under `src/`. A frontend type error will reach `master` unless you run the build locally.

Also review `ROADMAP.md`, `README.md`, and `CLAUDE.md` and update them to reflect any new behaviour, changed constants, new endpoints, new modules, or completed work introduced by the branch.

Fix all errors before committing. Do not open a PR with outstanding lint, type, or build errors.

## Architecture

### Module roles

**Backend**

- **`backend/app/main.py`** — FastAPI app with lifespan (attempts Garmin login on startup, logs warning and continues if it fails), CORS middleware, and global exception handlers (`GarminConnectTooManyRequestsError` → 429, `GarminConnectAuthenticationError` → 401).
- **`backend/app/config.py`** — `pydantic-settings` reads `.env` for `GARMIN_EMAIL`, `GARMIN_PASSWORD`, `CACHE_TTL_SECONDS`, `CORS_ORIGINS`.
- **`backend/app/garmin_client.py`** — Singleton Garmin client wrapper with in-memory TTL cache (`dict[str, tuple[float, Any]]`). All Garmin API calls go through here. Cache TTLs: activities list 600s, daily health metrics 300s, training metrics 600s, activity detail/splits 3600s (immutable), gear 3600s. Uses `cast()` throughout to satisfy mypy strict mode over the untyped garminconnect library.
- **`backend/app/routers/activities.py`** — `/api/activities` (paginated, filtered to running), `/api/activities/{id}`, `/api/activities/{id}/splits`.
- **`backend/app/routers/health.py`** — `/api/health/heart-rate`, `/api/health/hrv`, `/api/health/stress`, `/api/health/spo2`, `/api/health/sleep`, `/api/health/summary`, `/api/health/body-battery`. All accept `?date=YYYY-MM-DD`, default to today.
- **`backend/app/routers/training.py`** — `/api/training/max-metrics`, `/api/training/readiness`, `/api/training/status`, `/api/training/race-predictions`. Date endpoints default to today. Readiness unwraps a list response to a single object.
- **`backend/app/routers/stats.py`** — `/api/stats/mileage` (year/month/week totals in miles), `/api/stats/goals` (reads `goals.json` at project root, joins with mileage data to compute progress).
- **`backend/app/routers/gear.py`** — `/api/gear/shoes` (active shoes from Garmin gear service, with stats and last-used date from recent activity scan).
- **`backend/tests/`** — pytest suite; all tests mock the Garmin client so no credentials are needed in CI.

**Config files**

- **`goals.json`** (project root) — local mileage goal config. Each entry: `{"name": "...", "target_mi": 1023, "period": "year"}`. Period is `"year"`, `"month"`, or `"week"`. The backend reads this on each `/api/stats/goals` request and computes current progress from live mileage data.

**Frontend**

- **`frontend/src/api/client.ts`** — Fetch wrapper and all TanStack Query hooks with typed responses. All server state flows through here.
- **`frontend/src/types/garmin.ts`** — TypeScript interfaces for all API response shapes.
- **`frontend/src/components/Layout.tsx`** — Desktop sidebar nav (5 items: Dashboard, Activities, Training, Gear, Health) + mobile fixed bottom nav + `ErrorBoundary` wrapping `<Outlet />`.
- **`frontend/src/data/trainingPlan.ts`** — Static 24-week 50-mile ultramarathon plan (Relentless Forward Commotion / Hart Strength & Endurance Coaching), transcribed from the source sheet. Exports `PLAN` (weeks with dated days), `RACE_DATE`, `CELEBRATION`, `PEAK_MI`, and `weekFor(date)`. No backend or Garmin data involved.
- **`frontend/src/components/ActivityCard.tsx`** — Expandable row; fetches splits on click via `useActivitySplits(id, enabled)`. Distances and pace displayed in miles/min-per-mile.
- **`frontend/src/components/SplitsTable.tsx`** — Lap table rendering `lapDTOs` (pace in min/mi, distance in mi, HR, elevation per lap).
- **`frontend/src/components/GoalBar.tsx`** — Progress bar for a mileage goal; shows `current / target mi — X remaining`.
- **`frontend/src/components/MetricCard.tsx`** — Reusable label/value card with optional unit and sub-label.
- **`frontend/src/components/HeartRateChart.tsx`** — Recharts `LineChart` with downsampling to ~200 points.
- **`frontend/src/components/Skeleton.tsx`** — `Skeleton`, `SkeletonCard`, `SkeletonRow`, `SkeletonChart` — all use `animate-pulse`.
- **`frontend/src/components/ErrorBoundary.tsx`** — React class component; catches render errors and shows a styled fallback.
- **`frontend/src/pages/Dashboard.tsx`** — Readiness score (color-coded 0–100), VO2 max, training status, mileage summary (week/month/year), goals, recent shoes (last 2 used with progress bars), race predictions. Each section skeletons independently.
- **`frontend/src/pages/Activities.tsx`** — Paginated list (20/page) of `ActivityCard` components with previous/next pagination.
- **`frontend/src/pages/Training.tsx`** — 24-week plan calendar. Summary strip (current week, phase, weekly total, days to race), a hero card for the current week, and the full 24-week grid with per-week totals and cycle labels. Purely local data — no queries.
- **`frontend/src/pages/Gear.tsx`** — Active shoes sorted by most recently used; each card shows name, make/model, total miles, progress bar toward retirement limit (color-coded blue → orange at 80% → red at limit), last run date, and run count.
- **`frontend/src/pages/Health.tsx`** — Date picker, HR line chart, HRV/stress/SpO2/sleep metric cards, sleep stage breakdown. Each metric skeletons independently.

### Key design details

- **Sync route handlers**: `garminconnect` uses blocking I/O. Route handlers use `def` not `async def` — FastAPI auto-runs them in a threadpool.
- **Rate limit defense**: Garmin has aggressive 429 rate limits on SSO endpoints. The in-memory TTL cache in `garmin_client.py` is the primary defense. Lifespan login failure is non-fatal — server starts and retries on first request.
- **No database**: Data is fetched on-demand from Garmin. Backend caches in-memory (TTL dict), frontend caches via TanStack Query `staleTime`. No local persistence beyond OAuth tokens.
- **Gear last-used detection**: `get_shoes()` scans up to 30 recent activities via `get_activity_gear(activity_id)` to find the last date each shoe was worn. Stops early once all active shoes are found. Results sorted by `last_used` descending.
- **Vite proxy**: `vite.config.ts` proxies `/api` requests to `http://localhost:8001`. CORS middleware on the backend is also configured as a fallback.
- **Responsive layout**: Desktop uses a `w-48` sidebar (`hidden md:flex`). Mobile uses a fixed bottom nav (`md:hidden`). Some activity stats are `hidden sm:inline` to prevent overflow on small screens.
- **No user-facing auth**: Personal localhost dashboard. No auth between frontend and backend.
- **Training plan day shift**: the source sheet rests on Monday and Friday. Every workout is shifted one day earlier so rest falls on Thursday and Sunday, which makes a plan week run Sunday → Saturday and puts the long run on Friday. Anchored by `ANCHOR_WEEK`/`ANCHOR_START` in `trainingPlan.ts` (week 8 starts Sun Jul 26, 2026). Both the week number and the dates derive from a row's **position** in `ROWS`, so the plan is always numbered 1–24 consecutively and reordering it is just moving a row. Weeks 8 and 9 carry the sheet's week 9 and 8 workouts, putting the cutback during work travel. The two race weeks are exceptions — races stay on Saturday and the freed Friday becomes race-eve rest: week 20's tune-up 50K displaces the sheet's recovery run (weekly total 59 → 53), and week 24's `CELEBRATE!` spills to the Sunday after the grid.
- **All distances in miles**: Activity distances, pace (min/mi), splits, mileage summaries, and shoe mileage all use US customary units throughout.
