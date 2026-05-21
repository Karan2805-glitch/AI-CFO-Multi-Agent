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

    # Extract recommendations and detailed recommendations
    rec_obj = result.get("recommendations", {})
    recs_flat = rec_obj.get("recommendations", [])
    recs_detailed = rec_obj.get("recommendations_detailed", [])

    # Extract auditor
    auditor_obj = result.get("auditor", {})

    # Extract anomalies
    anomalies_obj = result.get("anomalies", {})
    if isinstance(anomalies_obj, list):
        anomalies_list = anomalies_obj
        anomalies_dict = {"anomalies": anomalies_obj, "anomalies_detailed": []}
    else:
        anomalies_list = anomalies_obj.get("anomalies", [])
        anomalies_dict = anomalies_obj

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

        # 🔹 Insights (backward compatible)
        "insights": {
            "recommendations": recs_flat,
            "recommendations_detailed": recs_detailed,
            "summary": auditor_obj.get("summary"),
            "anomalies": anomalies_list
        },

        # 🔹 Rich Integration Data (for detailed dashboard metrics)
        "auditor": auditor_obj,
        "recommendations": rec_obj,
        "recommendations_detailed": recs_detailed,
        "anomalies": anomalies_dict,

        # 🔹 Pipeline Telemetry & Execution Graph Data
        "completed_agents": result.get("completed_agents", []),
        "failed_agents": result.get("failed_agents", []),
        "overall_confidence": result.get("overall_confidence"),
        "execution_trace": result.get("execution_trace", {}),
    }


@router.get("/{run_id}/{agent}")
def get_agent(run_id: str, agent: str, db: Session = Depends(get_db)):

    run = db.query(AnalysisRun).filter_by(id=run_id).first()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return run.result.get(agent, {})
