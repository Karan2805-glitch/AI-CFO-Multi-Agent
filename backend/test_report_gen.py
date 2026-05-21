import os
import sys
sys.path.insert(0, os.path.abspath('.'))

from app.db import SessionLocal
from app.models import AnalysisRun
from app.routes.report import generate_report

db = SessionLocal()
run = db.query(AnalysisRun).first()
if run:
    print(f"Testing report generation for run: {run.id}")
    try:
        response = generate_report(run.id, db)
        if hasattr(response, 'status_code'):
            print("Success! Response status:", response.status_code)
            print("PDF Size:", len(response.body), "bytes")
        else:
            print("Success! Generated PDF.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error generating report:", e)
else:
    print("No AnalysisRun found in DB")
