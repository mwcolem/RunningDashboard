# Running Dashboard

A personal dashboard for Garmin Connect data — running activities, health metrics, and training load.

**Stack**: Python/FastAPI backend · TypeScript/React frontend · [`garminconnect`](https://pypi.org/project/garminconnect/) library

## Setup

**1. Credentials**

Copy `.env.example` to `.env` and fill in your Garmin credentials:

```bash
cp .env.example .env
```

```env
GARMIN_EMAIL=your@email.com
GARMIN_PASSWORD=yourpassword
```

OAuth tokens are cached at `~/.garminconnect/` after first login.

**2. Backend**

Requires Python 3.12+.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

**3. Frontend**

```bash
cd frontend
npm install
```

## Running

```bash
# Backend only (http://localhost:8001)
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8001

# Frontend only (http://localhost:5174)
cd frontend && npm run dev

# Both at once
make dev
```

API docs available at `http://localhost:8001/docs`.

## Development

```bash
# Tests with coverage
cd backend && .venv/bin/pytest tests/

# Type checking
cd backend && .venv/bin/mypy app/

# Lint
cd backend && .venv/bin/ruff check app/
```

## Training plans

Each training plan gets its own tab. To add one, put the schedule in a TSV —
one row per week, `cycle` then Sunday…Saturday then the weekly total, with cells
in calendar order — and generate the tab:

```bash
cd frontend
npm run new-plan -- schedule.tsv --name "Boston 2027" --end 2027-04-17
npm run lint && npm run build
```

`--end` is the last day of the grid and must be a Saturday; every other date
counts backwards from it. The script writes the plan data and page, and wires up
the route and nav item. See `frontend/scripts/example-plan.tsv` for a runnable
sample, and `npm run new-plan -- --help` for all options.

## Architecture

See [`ROADMAP.md`](ROADMAP.md) for the full implementation plan and [`CLAUDE.md`](CLAUDE.md) for codebase guidance.

Data is fetched on-demand from Garmin Connect with in-memory TTL caching to avoid rate limits. No local database.
