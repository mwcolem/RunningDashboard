from datetime import date as real_date
from unittest.mock import patch

import pytest

import app.garmin_client as gc

# Freeze to a known Tuesday; week starts Mon 2026-05-25, month 2026-05-01
FROZEN_TODAY = real_date(2026, 5, 26)

M_PER_MI = 1609.344


def activity(start_date: str, miles: float) -> dict:
    return {"startTimeLocal": f"{start_date}T08:00:00", "distance": miles * M_PER_MI}


# ---------------------------------------------------------------------------
# get_mileage_summary
# ---------------------------------------------------------------------------

def test_mileage_buckets_year_month_week(mock_garmin):
    mock_garmin.get_activities_by_date.return_value = [
        activity("2026-01-15", 5.0),  # year only
        activity("2026-05-10", 5.0),  # year + month
        activity("2026-05-25", 5.0),  # year + month + week (Monday)
    ]
    with patch("app.garmin_client.date") as mock_date:
        mock_date.today.return_value = FROZEN_TODAY
        result = gc.get_mileage_summary()

    assert result["year_mi"] == pytest.approx(15.0, abs=0.05)
    assert result["month_mi"] == pytest.approx(10.0, abs=0.05)
    assert result["week_mi"] == pytest.approx(5.0, abs=0.05)


def test_mileage_excludes_future_week_activity(mock_garmin):
    mock_garmin.get_activities_by_date.return_value = [
        activity("2026-05-24", 5.0),  # Sunday — before Monday week start
        activity("2026-05-25", 5.0),  # Monday — in week
    ]
    with patch("app.garmin_client.date") as mock_date:
        mock_date.today.return_value = FROZEN_TODAY
        result = gc.get_mileage_summary()

    assert result["week_mi"] == pytest.approx(5.0, abs=0.05)
    assert result["month_mi"] == pytest.approx(10.0, abs=0.05)


def test_mileage_empty_activities(mock_garmin):
    mock_garmin.get_activities_by_date.return_value = []
    with patch("app.garmin_client.date") as mock_date:
        mock_date.today.return_value = FROZEN_TODAY
        result = gc.get_mileage_summary()

    assert result == {"year_mi": 0.0, "month_mi": 0.0, "week_mi": 0.0}


# ---------------------------------------------------------------------------
# get_daily_mileage
# ---------------------------------------------------------------------------

def test_daily_mileage_sums_runs_per_day(mock_garmin):
    mock_garmin.get_activities_by_date.return_value = [
        activity("2026-05-25", 6.0),
        activity("2026-05-25", 4.0),  # double day — summed
        activity("2026-05-27", 12.0),
    ]
    result = gc.get_daily_mileage("2026-05-24", "2026-05-27")

    assert result["2026-05-25"] == pytest.approx(10.0, abs=0.05)
    assert result["2026-05-27"] == pytest.approx(12.0, abs=0.05)
    assert "2026-05-26" not in result  # rest days are omitted, not zero-filled


def test_daily_mileage_skips_activities_without_a_date(mock_garmin):
    mock_garmin.get_activities_by_date.return_value = [
        {"startTimeLocal": None, "distance": 5.0 * M_PER_MI},
        activity("2026-05-25", 6.0),
    ]
    result = gc.get_daily_mileage("2026-05-24", "2026-05-27")

    assert result == {"2026-05-25": pytest.approx(6.0, abs=0.05)}


# ---------------------------------------------------------------------------
# get_shoes
# ---------------------------------------------------------------------------

SHOE_A = {
    "uuid": "uuid-a", "gearTypeName": "Shoes", "gearStatusName": "active",
    "displayName": "Shoe A", "customMakeModel": "Brand A",
    "maximumMeters": 804672.0, "dateBegin": "2024-01-01T00:00:00",
}
SHOE_B = {
    "uuid": "uuid-b", "gearTypeName": "Shoes", "gearStatusName": "active",
    "displayName": "Shoe B", "customMakeModel": "Brand B",
    "maximumMeters": None, "dateBegin": "2024-06-01T00:00:00",
}
STATS_A = {"totalDistance": 500_000.0, "totalActivities": 80}
STATS_B = {"totalDistance": 200_000.0, "totalActivities": 30}


def test_shoes_sorted_by_last_used(mock_garmin):
    mock_garmin.get_user_profile.return_value = {"id": 12345}
    mock_garmin.get_gear.return_value = [SHOE_A, SHOE_B]
    mock_garmin.get_gear_stats.side_effect = lambda uuid: (
        STATS_A if uuid == "uuid-a" else STATS_B
    )
    mock_garmin.get_activities.return_value = [
        {"activityId": 1, "startTimeLocal": "2026-05-25T08:00:00"},
        {"activityId": 2, "startTimeLocal": "2026-05-20T08:00:00"},
    ]
    mock_garmin.get_activity_gear.side_effect = lambda act_id: (
        [{"uuid": "uuid-b"}] if act_id == 1 else [{"uuid": "uuid-a"}]
    )

    result = gc.get_shoes()

    assert result[0]["name"] == "Shoe B"
    assert result[0]["last_used"] == "2026-05-25"
    assert result[1]["name"] == "Shoe A"
    assert result[1]["last_used"] == "2026-05-20"


def test_shoes_gear_fetch_error_is_skipped(mock_garmin):
    mock_garmin.get_user_profile.return_value = {"id": 12345}
    mock_garmin.get_gear.return_value = [SHOE_A]
    mock_garmin.get_gear_stats.return_value = STATS_A
    mock_garmin.get_activities.return_value = [
        {"activityId": 1, "startTimeLocal": "2026-05-25T08:00:00"},
    ]
    mock_garmin.get_activity_gear.side_effect = Exception("Garmin API error")

    result = gc.get_shoes()  # must not raise

    assert len(result) == 1
    assert result[0]["last_used"] is None


def test_shoes_missing_profile_id_raises(mock_garmin):
    mock_garmin.get_user_profile.return_value = {}  # no "id" key

    with pytest.raises(ValueError, match="'id'"):
        gc.get_shoes()


def test_shoes_excludes_retired(mock_garmin):
    retired = {**SHOE_A, "gearStatusName": "retired"}
    mock_garmin.get_user_profile.return_value = {"id": 12345}
    mock_garmin.get_gear.return_value = [retired, SHOE_B]
    mock_garmin.get_gear_stats.return_value = STATS_B
    mock_garmin.get_activities.return_value = []

    result = gc.get_shoes()

    assert len(result) == 1
    assert result[0]["name"] == "Shoe B"
