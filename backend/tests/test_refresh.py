import app.garmin_client as gc


def test_refresh_clears_cache(client):
    gc._store("activities:0:20", [{"activityId": 1}])
    gc._store("shoes", [])

    response = client.post("/api/refresh")

    assert response.status_code == 200
    assert response.json() == {"cleared": 2}
    assert gc._cache == {}


def test_refresh_on_empty_cache(client):
    response = client.post("/api/refresh")

    assert response.status_code == 200
    assert response.json() == {"cleared": 0}


def test_refresh_refetches_from_garmin(client, mock_garmin):
    mock_garmin.get_activities.return_value = [{"activityId": 1, "activityType": {"typeKey": "running"}}]
    client.get("/api/activities")
    assert mock_garmin.get_activities.call_count == 1

    client.get("/api/activities")
    assert mock_garmin.get_activities.call_count == 1  # served from cache

    client.post("/api/refresh")
    client.get("/api/activities")
    assert mock_garmin.get_activities.call_count == 2
