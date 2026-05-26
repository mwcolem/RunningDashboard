from typing import Any

from fastapi import APIRouter

import app.garmin_client as gc

router = APIRouter(prefix="/api/activities")


@router.get("")
def list_activities(start: int = 0, limit: int = 20) -> Any:
    return gc.get_activities(start, limit)


@router.get("/{activity_id}")
def get_activity(activity_id: int) -> Any:
    return gc.get_activity(activity_id)


@router.get("/{activity_id}/splits")
def get_splits(activity_id: int) -> Any:
    return gc.get_activity_splits(activity_id)
