"""
End-to-end test: register → login → create session → upload CSV → verify analyze route.
Uses FastAPI TestClient (no live server needed).
"""
import io
import time

from fastapi.testclient import TestClient
from nanoid import generate

from app.main import app
from app.db import SessionLocal
from app.models import User, Session as SessionModel, AnalysisRun

client = TestClient(app)

# ── Minimal sample CSV ──────────────────────────────────────────────────────
SAMPLE_CSV = """\
months,revenue,salaries,rent,marketing
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


def sep(label):
    print(f"\n{'-' * 55}")
    print(f"  {label}")
    print('-' * 55)


def run_tests():
    unique_id = generate(size=6)
    email = f"test_{unique_id}@cfo-test.com".lower()
    password = "SecurePass123!"
    name = "Test CFO User"

    # ── 1. Register ──────────────────────────────────────────────────────────
    sep("1. Register")
    reg = client.post("/auth/register", json={"name": name, "email": email, "password": password})
    assert reg.status_code == 200, f"FAIL: {reg.text}"
    token = reg.json()["access_token"]
    print(f"   [PASS] Registered: {email}")

    headers = {"Authorization": f"Bearer {token}"}

    # ── 2. Login ─────────────────────────────────────────────────────────────
    sep("2. Login")
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, f"FAIL: {login.text}"
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   [PASS] Login OK, token refreshed")

    # ── 3. GET /auth/me ───────────────────────────────────────────────────────
    sep("3. GET /auth/me")
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200, f"FAIL: {me.text}"
    assert me.json()["email"] == email
    print(f"   [PASS] Profile: {me.json()['name']}")

    # ── 4. Create session ────────────────────────────────────────────────────
    sep("4. POST /session/start")
    sess = client.post("/session/start", json={
        "username": name, "company": "Acme Corp", "industry": "SaaS"
    })
    assert sess.status_code == 200, f"FAIL: {sess.text}"
    session_id = sess.json()["session_id"]
    print(f"   [PASS] Session created: {session_id}")

    # ── 5. Upload CSV & analyze ──────────────────────────────────────────────
    sep("5. POST /analyze  (this runs the full AI pipeline)")
    csv_bytes = SAMPLE_CSV.encode("utf-8")
    t0 = time.perf_counter()
    analyze_resp = client.post(
        f"/analyze?session_id={session_id}",
        files={"file": ("sample.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    elapsed = (time.perf_counter() - t0) * 1000
    assert analyze_resp.status_code == 200, f"FAIL: {analyze_resp.text}"
    data = analyze_resp.json()
    assert data["status"] == "success"
    run_id = data["run_id"]
    summary = data["summary"]
    print(f"   [PASS] Analysis complete in {elapsed:.0f} ms")
    print(f"          run_id       : {run_id}")
    print(f"          health_score : {summary['health_score']}")
    print(f"          risk_level   : {summary['risk_level']}")
    print(f"          total_revenue: {summary['total_revenue']}")
    print(f"          profit       : {summary['profit']}")

    # ── 6. Fetch run result ───────────────────────────────────────────────────
    sep("6. GET /results/{run_id}")
    result_resp = client.get(f"/results/{run_id}")
    assert result_resp.status_code == 200, f"FAIL: {result_resp.text}"
    result_data = result_resp.json()
    agents_present = [k for k in ("kpi", "risk", "forecast", "anomalies", "auditor") if result_data.get(k)]
    print(f"   [PASS] Result fetched. Agents present: {agents_present}")

    # ── 7. Rejection tests ────────────────────────────────────────────────────
    sep("7. Rejection: /auth/me without token")
    r = client.get("/auth/me")
    assert r.status_code == 401
    print("   [PASS] 401 for missing token")

    sep("8. Rejection: /analyze with bad session_id")
    bad = client.post(
        "/analyze?session_id=nonexistent-id",
        files={"file": ("sample.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert bad.status_code == 404
    print("   [PASS] 404 for unknown session_id")

    sep("9. Rejection: /analyze with non-CSV file")
    bad_ext = client.post(
        f"/analyze?session_id={session_id}",
        files={"file": ("data.xlsx", io.BytesIO(b"fake"), "application/octet-stream")},
    )
    assert bad_ext.status_code == 400
    print("   [PASS] 400 for non-CSV upload")

    # ── Cleanup ───────────────────────────────────────────────────────────────
    sep("Cleanup")
    db = SessionLocal()
    try:
        db.query(AnalysisRun).filter_by(session_id=session_id).delete()
        db.query(SessionModel).filter_by(id=session_id).delete()
        db.query(User).filter_by(email=email).delete()
        db.commit()
        print("   [PASS] Test data removed from DB")
    finally:
        db.close()

    print("\n" + "=" * 55)
    print("  ALL TESTS PASSED")
    print("=" * 55 + "\n")


if __name__ == "__main__":
    run_tests()
