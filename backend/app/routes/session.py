from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AnalysisRun, Session as SessionModel

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


@router.get("/list")
def list_sessions(username: str = Query(...), db: Session = Depends(get_db)):
    """List all sessions for a given username, ordered by newest first."""

    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.username == username)
        .order_by(SessionModel.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        run_count = (
            db.query(func.count(AnalysisRun.id))
            .filter(AnalysisRun.session_id == s.id)
            .scalar()
        )
        result.append({
            "session_id": s.id,
            "username": s.username,
            "company": s.company,
            "industry": s.industry,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "run_count": run_count,
        })

    return {"sessions": result, "count": len(result)}


@router.get("/list/runs")
def list_all_runs(username: str = Query(...), db: Session = Depends(get_db)):
    """List all runs across all sessions for a given username, newest first."""

    session_ids = select(SessionModel.id).where(SessionModel.username == username)

    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.session_id.in_(session_ids))
        .order_by(AnalysisRun.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "count": len(runs),
        "runs": [
            {
                "run_id": r.id,
                "session_id": r.session_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "health_score": r.health_score,
                "risk_level": r.risk_level,
                "revenue": r.result.get("kpi", {}).get("total_revenue") if r.result else None,
                "profit": r.result.get("kpi", {}).get("profit") if r.result else None,
            }
            for r in runs
        ],
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