import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure the backend directory is resolvable by pytest
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app.main import app
from app.db import engine, Base, get_db

# ---------------------------------------------------------------------------
# Database setup — uses whatever DATABASE_URL is set in the environment.
# CI sets this to a real Postgres (via service container).
# Local dev uses your Neon DATABASE_URL from backend/.env.
# No SQLite fallback — we require a real Postgres connection.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before the test session and drop them afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    """
    Yields a database session that is rolled back after each test function,
    ensuring full isolation between tests.
    """
    connection = engine.connect()
    transaction = connection.begin()
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(bind=connection)
    session = SessionLocal()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient with the DB dependency overridden to the per-test
    session, so every test operates on a clean, rolled-back transaction.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
