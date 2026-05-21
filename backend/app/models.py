from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db import Base
from nanoid import generate
from sqlalchemy import Column, String

def generate_session_id():
    return f"sess_{generate(size=10)}"

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_session_id)
    username = Column(String, nullable=False)
    company = Column(String)
    industry = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String, primary_key=True, default=generate_session_id)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"))
    row_count = Column(Integer)
    health_score = Column(Integer)
    risk_level = Column(String)
    
    result = Column(JSON)

    status = Column(String, default="completed")
    error_message = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"u_{generate(size=10)}")
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)
    provider = Column(String, default="email")
    photo = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "provider": self.provider,
            "photo": self.photo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }