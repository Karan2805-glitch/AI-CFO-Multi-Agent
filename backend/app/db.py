from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import declarative_base, sessionmaker
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "For local dev, create backend/.env with your Neon Postgres URL. "
        "For tests, set DATABASE_URL=sqlite:///:memory:"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # important for Neon / serverless connections
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()