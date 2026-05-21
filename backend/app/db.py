from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import declarative_base, sessionmaker
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aicfo.db")

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
