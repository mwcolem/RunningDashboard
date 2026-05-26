import json
import pytest
from unittest.mock import patch


MILEAGE = {"year_mi": 501.8, "month_mi": 42.5, "week_mi": 12.1}


@pytest.fixture
def goals_file(tmp_path):
    f = tmp_path / "goals.json"
    f.write_text(json.dumps([
        {"name": "Most miles ever - 2026", "target_mi": 1023, "period": "year"},
    ]))
    return f


def test_mileage(client):
    with patch("app.garmin_client.get_mileage_summary", return_value=MILEAGE):
        response = client.get("/api/stats/mileage")
    assert response.status_code == 200
    data = response.json()
    assert data["year_mi"] == 501.8
    assert data["week_mi"] == 12.1


def test_goals_pct(client, goals_file):
    with (
        patch("app.garmin_client.get_mileage_summary", return_value=MILEAGE),
        patch("app.routers.stats.GOALS_FILE", goals_file),
    ):
        response = client.get("/api/stats/goals")
    assert response.status_code == 200
    goals = response.json()
    assert len(goals) == 1
    goal = goals[0]
    assert goal["name"] == "Most miles ever - 2026"
    assert goal["target_mi"] == 1023
    assert goal["current_mi"] == pytest.approx(501.8)
    assert goal["pct"] == pytest.approx(49.1, abs=0.2)


def test_goals_missing_file(client, tmp_path):
    nonexistent = tmp_path / "no_goals.json"
    with patch("app.routers.stats.GOALS_FILE", nonexistent):
        response = client.get("/api/stats/goals")
    assert response.status_code == 200
    assert response.json() == []
