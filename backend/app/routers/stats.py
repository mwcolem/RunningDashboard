import json
import time
from pathlib import Path
from typing import Any

from fastapi import APIRouter

import app.garmin_client as gc

router = APIRouter(prefix="/api/stats")

GOALS_FILE = Path(__file__).resolve().parents[3] / "goals.json"
_GOALS_TTL = 60.0
_goals_cache: tuple[float, list[dict[str, Any]]] | None = None


def _read_goals_file() -> list[dict[str, Any]]:
    global _goals_cache
    if _goals_cache is not None and time.time() - _goals_cache[0] < _GOALS_TTL:
        return _goals_cache[1]
    if not GOALS_FILE.exists():
        return []
    data: list[dict[str, Any]] = json.loads(GOALS_FILE.read_text())
    _goals_cache = (time.time(), data)
    return data


@router.get("/mileage")
def get_mileage() -> Any:
    return gc.get_mileage_summary()


@router.get("/goals")
def get_goals() -> Any:
    goals = _read_goals_file()
    if not goals:
        return []

    mileage = gc.get_mileage_summary()
    period_map = {
        "year": mileage["year_mi"],
        "month": mileage["month_mi"],
        "week": mileage["week_mi"],
    }

    result = []
    for g in goals:
        period = g.get("period", "year")
        current = period_map.get(period, 0.0)
        target = g.get("target_mi", 0)
        pct = round(min(100.0, current / target * 100), 1) if target > 0 else 0.0
        result.append({
            "name": g.get("name", "Goal"),
            "period": period,
            "target_mi": target,
            "current_mi": current,
            "pct": pct,
        })

    return result
