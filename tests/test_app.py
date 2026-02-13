import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_activity():
    name = "Automated Test Activity"
    activities[name] = {
        "description": "temporary",
        "schedule": "now",
        "max_participants": 5,
        "participants": [],
    }
    yield name
    activities.pop(name, None)


def test_get_activities(client, test_activity):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert test_activity in data
    assert data[test_activity]["participants"] == []


def test_signup_and_remove_participant(client, test_activity):
    email = "tester@example.com"

    # Sign up
    resp = client.post(f"/activities/{test_activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {test_activity}"
    assert email in activities[test_activity]["participants"]

    # Duplicate signup should fail
    resp_dup = client.post(f"/activities/{test_activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Remove participant
    resp_rem = client.delete(f"/activities/{test_activity}/participants?email={email}")
    assert resp_rem.status_code == 200
    assert resp_rem.json()["message"] == f"Removed {email} from {test_activity}"
    assert email not in activities[test_activity]["participants"]

    # Removing again should 404
    resp_rem2 = client.delete(f"/activities/{test_activity}/participants?email={email}")
    assert resp_rem2.status_code == 404
