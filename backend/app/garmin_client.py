import logging
import time
from typing import Any

from garminconnect import Garmin, GarminConnectAuthenticationError

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Garmin | None = None

_cache: dict[str, tuple[float, Any]] = {}

TTL_ACTIVITIES = 600
TTL_HEALTH = 300
TTL_TRAINING = 600
TTL_ACTIVITY_DETAIL = 3600


def _cached(key: str, ttl: int) -> Any | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _store(key: str, data: Any) -> None:
    _cache[key] = (time.time(), data)


def get_client() -> Garmin:
    global _client
    if _client is None:
        settings = get_settings()
        _client = Garmin(email=settings.garmin_email, password=settings.garmin_password)
        _client.login(tokenstore=settings.garmin_tokenstore)
        logger.info("Garmin client initialized")
    return _client


def get_activities(start: int = 0, limit: int = 20) -> list[dict[str, Any]]:
    key = f"activities:{start}:{limit}"
    if (cached := _cached(key, TTL_ACTIVITIES)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_activities(start, limit, activitytype="running")
    _store(key, data)
    return data  # type: ignore[return-value]


def get_activity(activity_id: int) -> dict[str, Any]:
    key = f"activity:{activity_id}"
    if (cached := _cached(key, TTL_ACTIVITY_DETAIL)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_activity(activity_id)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_activity_splits(activity_id: int) -> dict[str, Any]:
    key = f"splits:{activity_id}"
    if (cached := _cached(key, TTL_ACTIVITY_DETAIL)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_activity_splits(activity_id)
    _store(key, data)
    return data  # type: ignore[return-value]
