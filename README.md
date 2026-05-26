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
# Backend only (http://localhost:8000)
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend only (http://localhost:5173)
cd frontend && npm run dev

# Both at once
make dev
```

API docs available at `http://localhost:8000/docs`.

## Development

```bash
# Tests with coverage
cd backend && pytest tests/

# Type checking
cd backend && mypy app/

# Lint
cd backend && ruff check app/
```

## Architecture

See [`ROADMAP.md`](ROADMAP.md) for the full implementation plan and [`CLAUDE.md`](CLAUDE.md) for codebase guidance.

Data is fetched on-demand from Garmin Connect with in-memory TTL caching to avoid rate limits. No local database.
