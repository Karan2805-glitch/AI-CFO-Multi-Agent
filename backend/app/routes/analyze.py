import io

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AnalysisRun, Session as SessionModel
from app.services.analysis_service import analyze

router = APIRouter()


@router.post("/analyze")
async def analyze_csv(
    session_id: str = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    session_id = session_id.strip()

    # DB query off the event loop.
    session = await run_in_threadpool(lambda: db.query(SessionModel).filter_by(id=session_id).first())
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    try:
        contents = await file.read()

        # CSV parse off the event loop.
        df = await run_in_threadpool(lambda: pd.read_csv(io.StringIO(contents.decode("utf-8"))))

        result = await analyze(df)

        raw_health = result.get("health_score", {})
        if isinstance(raw_health, dict):
            health_score = int(raw_health.get("overall_score", raw_health.get("score", 0)))
        else:
            health_score = int(raw_health) if raw_health else 0
        risk_level = result.get("risk", {}).get("risk_level", "UNKNOWN")

        run = AnalysisRun(
            session_id=session_id,
            row_count=len(df),
            health_score=health_score,
            risk_level=risk_level,
            result=result
        )

        # DB write off the event loop.
        def _persist():
            db.add(run)
            db.commit()
            db.refresh(run)

        await run_in_threadpool(_persist)

        return {
            "status": "success",
            "run_id": run.id,
            "session_id": session_id,
            "summary": {
                "health_score": health_score,
                "risk_level": risk_level,
                "total_revenue": result.get("kpi", {}).get("total_revenue"),
                "profit": result.get("kpi", {}).get("profit")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        await run_in_threadpool(db.rollback)
        raise HTTPException(status_code=500, detail=str(e))
