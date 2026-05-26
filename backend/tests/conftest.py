import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

import app.garmin_client as gc
import app.routers.stats as stats_router


@pytest.fixture(autouse=True)
def clear_caches():
    gc._cache.clear()
    stats_router._goals_cache = None
    yield
    gc._cache.clear()
    stats_router._goals_cache = None


@pytest.fixture
def mock_garmin():
    """Garmin client mock — prevents any real network calls."""
    mock = MagicMock()
    with patch("app.garmin_client._client", mock):
        yield mock


@pytest.fixture
def client(mock_garmin):
    from app.main import app
    with TestClient(app) as c:
        yield c
