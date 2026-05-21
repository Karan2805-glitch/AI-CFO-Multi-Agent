from fastapi.testclient import TestClient
from app.main import app
from app.db import SessionLocal
from app.models import User
from nanoid import generate

def run_auth_verification():
    print("Starting JWT Authentication Verification...")
    client = TestClient(app)

    # Generate a unique email to prevent user conflicts
    unique_id = generate(size=6)
    email = f"test_{unique_id}@cfo-test.com".lower()
    password = "SuperSecurePassword123"
    name = "Test User"

    print(f"1. Testing Registration for: {email}")
    register_payload = {
        "name": name,
        "email": email,
        "password": password
    }
    reg_response = client.post("/auth/register", json=register_payload)
    assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email
    print("   [PASS] Registration succeeded and returned a JWT access token.")

    token = reg_data["access_token"]

    print("2. Testing Login...")
    login_payload = {
        "email": email,
        "password": password
    }
    login_response = client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    login_data = login_response.json()
    assert "access_token" in login_data
    print("   [PASS] Login succeeded and returned a JWT access token.")

    login_token = login_data["access_token"]

    print("3. Testing Access to Protected Route (/auth/me) with Valid JWT...")
    headers = {
        "Authorization": f"Bearer {login_token}"
    }
    me_response = client.get("/auth/me", headers=headers)
    assert me_response.status_code == 200, f"Access to /auth/me failed: {me_response.text}"
    me_data = me_response.json()
    assert me_data["email"] == email
    print(f"   [PASS] Successfully fetched profile for user: {me_data['name']}")

    print("4. Testing Access to /auth/me with MISSING Token...")
    no_token_response = client.get("/auth/me")
    assert no_token_response.status_code == 401
    print("   [PASS] Correctly rejected request with 401 Unauthorized.")

    print("5. Testing Access to /auth/me with INVALID Token...")
    invalid_headers = {
        "Authorization": "Bearer invalid_token_here"
    }
    invalid_token_response = client.get("/auth/me", headers=invalid_headers)
    assert invalid_token_response.status_code == 401
    print("   [PASS] Correctly rejected invalid token with 401 Unauthorized.")

    # Database Cleanup
    print("6. Cleaning up database...")
    db = SessionLocal()
    try:
        user_to_delete = db.query(User).filter(User.email == email).first()
        if user_to_delete:
            db.delete(user_to_delete)
            db.commit()
            print("   [PASS] Cleanup complete. Test user removed.")
    finally:
        db.close()

    print("\n[SUCCESS] ALL AUTHENTICATION VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_auth_verification()
