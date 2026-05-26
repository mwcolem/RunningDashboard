import logging
import time
from datetime import date
from typing import Any

from garminconnect import Garmin

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


def get_max_metrics(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"max_metrics:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_max_metrics(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_training_readiness(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"training_readiness:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_training_readiness(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_training_status(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"training_status:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_training_status(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_race_predictions() -> dict[str, Any]:
    key = "race_predictions"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_race_predictions()
    _store(key, data)
    return data  # type: ignore[return-value]


def _today() -> str:
    return date.today().isoformat()


def get_user_summary(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"summary:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_user_summary(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_heart_rates(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"heart_rates:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_heart_rates(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_hrv_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"hrv:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_hrv_data(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_stress_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"stress:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_stress_data(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_spo2_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"spo2:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_spo2_data(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_sleep_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"sleep:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_sleep_data(d)
    _store(key, data)
    return data  # type: ignore[return-value]


def get_body_battery(d: str | None = None) -> list[Any]:
    d = d or _today()
    key = f"body_battery:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cached  # type: ignore[return-value]
    data = get_client().get_body_battery(d)
    _store(key, data)
    return data  # type: ignore[return-value]
