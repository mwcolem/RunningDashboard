from typing import Any

from fastapi import APIRouter

import app.garmin_client as gc

router = APIRouter(prefix="/api/training")


@router.get("/max-metrics")
def get_max_metrics(date: str | None = None) -> Any:
    return gc.get_max_metrics(date)


@router.get("/readiness")
def get_training_readiness(date: str | None = None) -> Any:
    data = gc.get_training_readiness(date)
    # API returns a list; unwrap to a single object
    if isinstance(data, list):
        return data[0] if data else {}
    return data


@router.get("/status")
def get_training_status(date: str | None = None) -> Any:
    return gc.get_training_status(date)


@router.get("/race-predictions")
def get_race_predictions() -> Any:
    return gc.get_race_predictions()
