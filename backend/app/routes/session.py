from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Session as SessionModel

router = APIRouter()


@router.post("/start")
def start_session(data: dict, db: Session = Depends(get_db)):

    username = data.get("username")

    if not username:
        raise HTTPException(status_code=400, detail="username is required")

    new_session = SessionModel(
        username=username,
        company=data.get("company"),
        industry=data.get("industry")
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "session_id": new_session.id,
        "username": new_session.username
    }


@router.get("/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session.id,
        "username": session.username,
        "company": session.company,
        "industry": session.industry,
        "created_at": session.created_at.isoformat() if session.created_at else None
    }