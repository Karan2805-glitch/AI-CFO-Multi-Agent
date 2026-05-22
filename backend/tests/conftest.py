import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure the backend directory is resolvable by pytest
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# ---------------------------------------------------------------------------
# Database safety isolation:
# If DATABASE_URL is set to a production/dev Neon Postgres connection string,
# we automatically redirect to a local SQLite test.db file to protect developer
# and production data from being dropped by the test suite.
# CI environments and local docker-compose environments explicitly pointing to
# a database containing 'test', 'localhost', or '@db' are allowed.
# ---------------------------------------------------------------------------
original_db_url = os.environ.get("DATABASE_URL")
if not original_db_url:
    # If not set, let's load from .env if available
    try:
        from dotenv import load_dotenv
        load_dotenv()
        original_db_url = os.environ.get("DATABASE_URL", "sqlite:///./aicfo.db")
    except ImportError:
        original_db_url = "sqlite:///./aicfo.db"

# If it is a Postgres-style URL, verify if it is a designated test database
if "postgres" in original_db_url or "neon" in original_db_url:
    if "test" not in original_db_url.lower() and "localhost" not in original_db_url.lower() and "@db" not in original_db_url.lower():
        print("\n" + "="*80)
        print("[WARNING] RUNNING TESTS AGAINST PRODUCTION/DEV POSTGRESQL DATABASE IS RESTRICTED.")
        print("[WARNING] Overriding DATABASE_URL to 'sqlite:///./test.db' to protect your active data!")
        print("="*80 + "\n")
        os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.main import app
from app.db import engine, Base, get_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before the test session and drop them afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    
    # Dispose of the engine connection pool to release open file handles (crucial for Windows)
    engine.dispose()
    
    # Automatically clean up temporary SQLite file after test execution
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("sqlite:///"):
        db_file = db_url.replace("sqlite:///", "")
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception as e:
                print(f"\n[Teardown] Could not clean up temporary SQLite file {db_file}: {e}")


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

