"""
Route-level integration tests.

These tests hit the real database (same DATABASE_URL used by the app) and
manage their own teardown — auth_data fixture registers a user and deletes it
after each test. This mirrors real end-to-end behaviour and avoids the
per-test transactional rollback pattern (which would hide sessions created
within a request from subsequent requests via different connections).
"""
import io
import time
from datetime import datetime
import pytest

from fastapi.testclient import TestClient
from nanoid import generate

from app.main import app
from app.db import SessionLocal
from app.models import User, Session as SessionModel, AnalysisRun

# Module-level client uses real DB — no dependency override here.
client = TestClient(app)

SAMPLE_CSV = """months,revenue,salaries,rent,marketing
2024-01,50000,20000,5000,3000
2024-02,55000,20000,5000,3500
2024-03,48000,21000,5000,4000
2024-04,60000,21000,5000,3000
2024-05,62000,22000,5200,3200
2024-06,58000,22000,5200,4500
2024-07,65000,23000,5200,3800
2024-08,70000,23000,5200,4000
2024-09,67000,24000,5500,3500
2024-10,72000,24000,5500,4200
2024-11,75000,25000,5500,4500
2024-12,80000,25000,5500,5000
"""

TEST_RESULTS = {
    "email": None,
    "session_id": None,
    "run_id": None,
    "health_score": None,
    "risk_level": None,
    "profit": None,
    "execution_ms": None,
    "tests": [],
}


@pytest.fixture(scope="session")
def test_context():
    return TEST_RESULTS


@pytest.fixture
def auth_data(test_context):
    """Register a fresh user for each test; clean up afterwards."""
    unique_id = generate(size=6)
    email = f"test_{unique_id}@cfo-test.com".lower()
    password = "SecurePass123!"
    name = "Test User"

    reg = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert reg.status_code == 200, f"Registration failed: {reg.text}"
    token = reg.json()["access_token"]
    test_context["email"] = email

    yield {
        "email": email,
        "password": password,
        "name": name,
        "headers": {"Authorization": f"Bearer {token}"},
    }

    # Teardown — remove the user and any runs/sessions created by this test.
    db = SessionLocal()
    try:
        if TEST_RESULTS["run_id"]:
            db.query(AnalysisRun).filter_by(id=TEST_RESULTS["run_id"]).delete()
        if TEST_RESULTS["session_id"]:
            db.query(SessionModel).filter_by(id=TEST_RESULTS["session_id"]).delete()
        db.query(User).filter_by(email=email).delete()
        db.commit()
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_login(auth_data, test_context):
    response = client.post(
        "/auth/login",
        json={"email": auth_data["email"], "password": auth_data["password"]},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    test_context["tests"].append("test_login")


def test_auth_me(auth_data, test_context):
    response = client.get("/auth/me", headers=auth_data["headers"])
    assert response.status_code == 200
    assert response.json()["email"].lower() == auth_data["email"]
    test_context["tests"].append("test_auth_me")


def test_session_create(auth_data, test_context):
    response = client.post(
        "/session/start",
        json={"username": auth_data["name"], "company": "Acme Corp", "industry": "SaaS"},
    )
    assert response.status_code == 200
    test_context["session_id"] = response.json()["session_id"]
    test_context["tests"].append("test_session_create")


def test_analyze_pipeline(auth_data, test_context):
    # Create a fresh session within this test — persisted to the real DB so
    # the analyze endpoint can find it via its own DB connection.
    session_resp = client.post(
        "/session/start",
        json={"username": auth_data["name"], "company": "Acme Corp", "industry": "SaaS"},
    )
    assert session_resp.status_code == 200, f"Session creation failed: {session_resp.text}"
    session_id = session_resp.json()["session_id"]
    test_context["session_id"] = session_id

    t0 = time.perf_counter()
    response = client.post(
        f"/analyze/analyze?session_id={session_id}",
        files={
            "file": (
                "sample.csv",
                io.BytesIO(SAMPLE_CSV.encode()),
                "text/csv",
            )
        },
    )
    elapsed = (time.perf_counter() - t0) * 1000

    assert response.status_code == 200, f"Analyze failed: {response.text}"
    data = response.json()
    assert data["status"] == "success"

    test_context["run_id"] = data["run_id"]
    summary = data["summary"]
    test_context["health_score"] = summary.get("health_score")
    test_context["risk_level"] = summary.get("risk_level")
    test_context["profit"] = summary.get("profit")
    test_context["execution_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    test_context["tests"].append("test_analyze_pipeline")


def test_auth_without_token(test_context):
    response = client.get("/auth/me")
    assert response.status_code == 401
    test_context["tests"].append("test_auth_without_token")


def test_invalid_session(test_context):
    response = client.post(
        "/analyze/analyze?session_id=invalid-id",
        files={"file": ("sample.csv", io.BytesIO(SAMPLE_CSV.encode()), "text/csv")},
    )
    assert response.status_code == 404
    test_context["tests"].append("test_invalid_session")


def test_invalid_file(test_context):
    response = client.post(
        "/analyze/analyze?session_id=fake-id",
        files={"file": ("data.xlsx", io.BytesIO(b"fake"), "application/octet-stream")},
    )
    assert response.status_code in [400, 404]
    test_context["tests"].append("test_invalid_file")


@pytest.fixture(scope="session", autouse=True)
def print_summary():
    yield
    print("\n")
    print("=" * 70)
    print("AI-CFO TEST EXECUTION SUMMARY")
    print("=" * 70)
    print(f"Time           : {datetime.now()}")
    print(f"Email          : {TEST_RESULTS['email']}")
    print(f"Session ID     : {TEST_RESULTS['session_id']}")
    print(f"Run ID         : {TEST_RESULTS['run_id']}")
    print(f"Health Score   : {TEST_RESULTS['health_score']}")
    print(f"Risk Level     : {TEST_RESULTS['risk_level']}")
    print(f"Profit         : {TEST_RESULTS['profit']}")
    print(f"Execution Time : {TEST_RESULTS['execution_ms']} ms")
    print("\nExecuted Tests:")
    for t in TEST_RESULTS["tests"]:
        print(f" [PASS] {t}")
    print("=" * 70)