from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io

from app.services.analysis_service import analyze

router = APIRouter()

@router.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Accept CSV → Process → Return structured financial insights
    """

    # ---- 1. Validate file ----
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    try:
        # ---- 2. Read CSV in-memory (NO disk I/O) ----
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # ---- 3. Run pipeline ----
        result = analyze(df)   # IMPORTANT: pass dataframe, not path

        # ---- 4. Structured response for frontend ----
        return {
            "status": "success",
            "meta": {
                "rows": len(df),
                "columns": list(df.columns)
            },
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))