from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.db import get_db
from app.models import AnalysisRun, Session as SessionModel
from app.services.analysis_service import analyze

router = APIRouter()

def compress_result(result: dict):
    # Retain the full agent response structures so the frontend has direct access to rich intelligence data
    return {
        "kpi": result.get("kpi"),
        "risk": result.get("risk"),
        "health_score": result.get("health_score"),
        "forecast": result.get("forecast"),
        "anomalies": result.get("anomalies", {}),
        "recommendations": result.get("recommendations", {}),
        "auditor": result.get("auditor", {}),
        "completed_agents": result.get("completed_agents", []),
        "failed_agents": result.get("failed_agents", []),
        "overall_confidence": result.get("overall_confidence"),
        "execution_trace": result.get("execution_trace", {}),
    }


@router.post("/analyze")
async def analyze_csv(
    session_id: str = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    session_id = session_id.strip()

    # Validate session
    session = db.query(SessionModel).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        result = await analyze(df)
        compressed = compress_result(result)

        # Extract integer health score from the health payload dict.
        # The DB column is Integer, so we must not store the raw dict.
        raw_health = compressed.get("health_score", {})
        if isinstance(raw_health, dict):
            health_score = int(raw_health.get("health_score", raw_health.get("overall_score", raw_health.get("score", 0))))
        else:
            health_score = int(raw_health) if raw_health else 0
        risk_level = compressed.get("risk", {}).get("risk_level", "UNKNOWN")

        run = AnalysisRun(
            session_id=session_id,
            row_count=len(df),
            health_score=health_score,
            risk_level=risk_level,
            result=compressed
        )

        db.add(run)
        db.commit()
        db.refresh(run)

        # 🔹 RETURN ONLY SUMMARY (optimized)
        return {
            "status": "success",
            "run_id": run.id,
            "session_id": session_id,

            "summary": {
                "health_score": health_score,
                "risk_level": risk_level,
                "total_revenue": compressed.get("kpi", {}).get("total_revenue"),
                "profit": compressed.get("kpi", {}).get("profit")
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
