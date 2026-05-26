import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_garmin():
    """Garmin client mock — prevents any real network calls."""
    with patch("app.garmin_client._client", MagicMock()):
        yield


@pytest.fixture
def client(mock_garmin):
    from app.main import app
    with TestClient(app) as c:
        yield c
