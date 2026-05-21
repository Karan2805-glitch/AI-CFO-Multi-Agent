from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from loguru import logger

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aicfo.db")

if not os.getenv("DATABASE_URL"):
    logger.warning("DATABASE_URL is not set — defaulting to sqlite aicfo.db via docker-compose.\nTo use Neon Postgres, set DATABASE_URL to your Neon connection string.")
else:
    if 'neon' in DATABASE_URL or DATABASE_URL.startswith('postgres') or 'postgresql' in DATABASE_URL:
        logger.info("Detected Postgres-style DATABASE_URL (looks like Neon/Postgres). Using provided connection string.")
    else:
        logger.info("DATABASE_URL set to: {}", DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # important for Neon
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
