import logging
import time
from datetime import date, timedelta
from typing import Any, cast

from garminconnect import Garmin

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Garmin | None = None

_cache: dict[str, tuple[float, Any]] = {}

TTL_ACTIVITIES = 600
TTL_HEALTH = 300
TTL_TRAINING = 600
TTL_ACTIVITY_DETAIL = 3600
TTL_GEAR = 3600


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
        return cast(list[dict[str, Any]], cached)
    data = get_client().get_activities(start, limit, activitytype="running")
    _store(key, data)
    return cast(list[dict[str, Any]], data)


def get_activity(activity_id: int) -> dict[str, Any]:
    key = f"activity:{activity_id}"
    if (cached := _cached(key, TTL_ACTIVITY_DETAIL)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_activity(activity_id)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_activity_splits(activity_id: int) -> dict[str, Any]:
    key = f"splits:{activity_id}"
    if (cached := _cached(key, TTL_ACTIVITY_DETAIL)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_activity_splits(activity_id)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_max_metrics(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"max_metrics:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_max_metrics(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_training_readiness(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"training_readiness:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_training_readiness(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_training_status(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"training_status:{d}"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_training_status(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_race_predictions() -> dict[str, Any]:
    key = "race_predictions"
    if (cached := _cached(key, TTL_TRAINING)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_race_predictions()
    _store(key, data)
    return cast(dict[str, Any], data)


def _today() -> str:
    return date.today().isoformat()


def get_user_summary(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"summary:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_user_summary(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_heart_rates(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"heart_rates:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_heart_rates(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_hrv_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"hrv:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_hrv_data(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_stress_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"stress:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_stress_data(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_spo2_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"spo2:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_spo2_data(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_sleep_data(d: str | None = None) -> dict[str, Any]:
    d = d or _today()
    key = f"sleep:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, Any], cached)
    data = get_client().get_sleep_data(d)
    _store(key, data)
    return cast(dict[str, Any], data)


def get_body_battery(d: str | None = None) -> list[Any]:
    d = d or _today()
    key = f"body_battery:{d}"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(list[Any], cached)
    data = get_client().get_body_battery(d)
    _store(key, data)
    return cast(list[Any], data)


def get_mileage_summary() -> dict[str, float]:
    key = "mileage_summary"
    if (cached := _cached(key, TTL_HEALTH)) is not None:
        return cast(dict[str, float], cached)

    today = date.today()
    year_start = today.replace(month=1, day=1).isoformat()
    week_start = (today - timedelta(days=today.weekday())).isoformat()
    month_start = today.replace(day=1).isoformat()
    today_str = today.isoformat()

    activities = get_client().get_activities_by_date(year_start, today_str, activitytype="running")

    year_m = 0.0
    month_m = 0.0
    week_m = 0.0

    for a in activities:
        dist = a.get("distance") or 0.0
        start = (a.get("startTimeLocal") or "")[:10]
        if start >= year_start:
            year_m += dist
        if start >= month_start:
            month_m += dist
        if start >= week_start:
            week_m += dist

    result = {
        "year_mi": round(year_m * 0.000621371, 2),
        "month_mi": round(month_m * 0.000621371, 2),
        "week_mi": round(week_m * 0.000621371, 2),
    }
    _store(key, result)
    return result


def get_shoes() -> list[dict[str, Any]]:
    key = "shoes"
    if (cached := _cached(key, TTL_GEAR)) is not None:
        return cast(list[dict[str, Any]], cached)

    client = get_client()
    profile = client.get_user_profile()
    user_id = profile.get("id")
    if not user_id:
        raise ValueError("Garmin user profile did not return an 'id' field")
    user_id = str(user_id)

    all_gear = client.get_gear(user_id)
    active_shoes = [
        g for g in all_gear
        if g.get("gearTypeName") == "Shoes" and g.get("gearStatusName") == "active"
    ]

    result: list[dict[str, Any]] = []
    uuid_to_idx: dict[str, int] = {}
    for shoe in active_shoes:
        uuid = shoe["uuid"]
        stats = client.get_gear_stats(uuid)
        total_m = stats.get("totalDistance") or 0.0
        total_mi = round(total_m * 0.000621371, 1)
        max_m = shoe.get("maximumMeters")
        max_mi = round(max_m * 0.000621371, 1) if max_m else None
        uuid_to_idx[uuid] = len(result)
        result.append({
            "uuid": uuid,
            "name": shoe.get("displayName", ""),
            "make_model": shoe.get("customMakeModel") or shoe.get("displayName", ""),
            "total_mi": total_mi,
            "total_activities": stats.get("totalActivities", 0),
            "max_mi": max_mi,
            "date_begin": (shoe.get("dateBegin") or "")[:10] or None,
            "last_used": None,
        })

    # Scan recent activities to find last_used date per shoe
    recent = client.get_activities(0, 10, activitytype="running")
    found: set[str] = set()
    for act in recent:
        if len(found) == len(result):
            break
        act_date = (act.get("startTimeLocal") or "")[:10] or None
        try:
            act_gear = client.get_activity_gear(act["activityId"])
        except Exception:
            logger.warning("Failed to fetch gear for activity %s — skipping", act.get("activityId"))
            continue
        if isinstance(act_gear, list):
            for g in act_gear:
                uuid = g.get("uuid", "")
                if uuid in uuid_to_idx and uuid not in found:
                    result[uuid_to_idx[uuid]]["last_used"] = act_date
                    found.add(uuid)

    result.sort(key=lambda s: s["last_used"] or "", reverse=True)
    _store(key, result)
    return result
