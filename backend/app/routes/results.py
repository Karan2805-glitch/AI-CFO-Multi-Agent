from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AnalysisRun

router = APIRouter()


@router.get("/{run_id}")
def get_result(run_id: str, db: Session = Depends(get_db)):

    run = db.query(AnalysisRun).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    result = run.result or {}

    return {
        "run_id": run.id,
        "session_id": run.session_id,
        "created_at": run.created_at.isoformat() if run.created_at else None,

        # 🔹 KPI Cards
        "kpis": result.get("kpi", {}),
        "health_score": run.health_score,

        # 🔹 Risk
        "risk": {
            "level": run.risk_level,
            "details": result.get("risk", {})
        },

        # 🔹 Charts (frontend ready)
        "charts": {
            "revenue_trend": result.get("forecast", {}).get("historical", []),
            "expense_trend": result.get("forecast", {}).get("historical_expenses", []),
            "forecast": result.get("forecast", {}).get("forecast", []),
            "expense_breakdown": result.get("kpi", {}).get("expense_breakdown", {})
        },

        # 🔹 Insights
        "insights": {
            "recommendations": result.get("recommendations", {}).get("recommendations", []),
            "summary": result.get("auditor", {}).get("summary")
        }
    }


@router.get("/{run_id}/{agent}")
def get_agent(run_id: str, agent: str, db: Session = Depends(get_db)):

    run = db.query(AnalysisRun).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return run.result.get(agent, {})