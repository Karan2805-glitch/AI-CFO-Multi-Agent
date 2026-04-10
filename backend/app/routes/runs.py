from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AnalysisRun, Session as SessionModel

router = APIRouter()


@router.get("/{session_id}")
def get_runs(session_id: str, db: Session = Depends(get_db)):

    session_id = session_id.strip()

    session = db.query(SessionModel).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.session_id == session_id)
        .order_by(AnalysisRun.created_at.desc())
        .all()
    )

    return {
        "session_id": session_id,
        "count": len(runs),
        "runs": [
            {
                "run_id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "health_score": r.health_score,
                "risk_level": r.risk_level,

                # 🔹 summary for dashboard list
                "revenue": r.result.get("kpi", {}).get("total_revenue"),
                "profit": r.result.get("kpi", {}).get("profit")
            }
            for r in runs
        ]
    }