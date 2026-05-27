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
    data = gc.get_training_status(date)
    # Normalize: extract the first device's entry from the device-keyed dict
    # and surface it as a flat latestTrainingStatusData for the frontend.
    device_map = data.get("mostRecentTrainingStatus", {}).get("latestTrainingStatusData", {})
    first_device: dict[str, Any] = next(iter(device_map.values()), {}) if isinstance(device_map, dict) else {}
    return {
        "mostRecentVO2Max": data.get("mostRecentVO2Max"),
        "latestTrainingStatusData": first_device,
    }


@router.get("/race-predictions")
def get_race_predictions() -> Any:
    return gc.get_race_predictions()
