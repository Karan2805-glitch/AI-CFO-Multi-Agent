import os
import sys
import io
import time
from pathlib import Path
from datetime import datetime

# Insert current path to resolve app imports
sys.path.insert(0, os.path.abspath('.'))

from fastapi.testclient import TestClient
from nanoid import generate
from app.main import app
from app.db import SessionLocal
from app.models import User, Session as SessionModel, AnalysisRun

client = TestClient(app)

def verify_dataset(csv_name):
    print("=" * 80)
    print(f"VERIFYING REPORT GENERATION FOR: {csv_name}")
    print("=" * 80)
    
    # 1. Locate the tools dataset
    csv_path = Path("..") / "tools" / csv_name
    if not csv_path.exists():
        csv_path = Path(".") / "tools" / csv_name
    if not csv_path.exists():
        csv_path = Path(f"d:/Projects/AI-CFO-Multi-Agent/tools/{csv_name}")
        
    print(f"Loading tools dataset from: {csv_path.resolve()}")
    if not csv_path.exists():
        print(f"ERROR: Dataset file {csv_name} not found!")
        return False
        
    with csv_path.open("rb") as f:
        csv_bytes = f.read()
        
    # 2. Register temporary user
    unique_id = generate(size=6)
    email = f"verify_{unique_id}@cfo-verify.com".lower()
    password = "VerificationPass123!"
    name = f"Indian MSME {csv_name.replace('.csv', '')} Demo"
    
    print(f"Registering verification user: {email}")
    reg = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password
        }
    )
    assert reg.status_code == 200, f"Registration failed: {reg.text}"
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Session
    print("Starting new analysis session...")
    session_resp = client.post(
        "/session/start",
        json={
            "username": name,
            "company": "Karan Enterprises Ltd",
            "industry": "Manufacturing & Commerce"
        },
        headers=headers
    )
    assert session_resp.status_code == 200, f"Session creation failed: {session_resp.text}"
    session_id = session_resp.json()["session_id"]
    print(f"Session started with ID: {session_id}")
    
    # 4. Upload and Analyze CSV Dataset
    print("Uploading dataset and running multi-agent analysis...")
    t0 = time.perf_counter()
    
    analyze_resp = client.post(
        f"/analyze?session_id={session_id}",
        files={
            "file": (
                csv_name,
                io.BytesIO(csv_bytes),
                "text/csv"
            )
        },
        headers=headers
    )
    
    elapsed = (time.perf_counter() - t0) * 1000
    if analyze_resp.status_code != 200:
        print(f"ERROR: Analysis pipeline failed: {analyze_resp.text}")
        return False
        
    data = analyze_resp.json()
    run_id = data["run_id"]
    summary = data["summary"]
    
    print(f"SUCCESS: Analysis pipeline completed in {elapsed:.0f} ms!")
    print(f"  - Run ID: {run_id}")
    print(f"  - Health Score: {summary.get('health_score')}/100")
    print(f"  - Risk Level: {summary.get('risk_level')}")
    print(f"  - Total Revenue: INR {summary.get('total_revenue'):,.2f}")
    print(f"  - Total Profit: INR {summary.get('profit'):,.2f}")
    
    # 5. Generate and Download Executive PDF Report
    print("Calling report generation endpoint to compile PDF...")
    report_resp = client.get(
        f"/report/generate/{run_id}",
        headers=headers
    )
    
    if report_resp.status_code != 200:
        print(f"ERROR: Report generation failed: {report_resp.text}")
        return False
        
    pdf_bytes = report_resp.content
    print(f"SUCCESS: PDF Report compiled successfully!")
    print(f"  - PDF Report Size: {len(pdf_bytes):,} bytes")
    
    # 6. Save PDF to tools directory
    pdf_output_name = csv_name.replace(".csv", "_Report.pdf")
    pdf_output_path = csv_path.parent / pdf_output_name
    pdf_output_path.write_bytes(pdf_bytes)
    print(f"Saved compiled PDF report to: {pdf_output_path.resolve()}")
    
    # 7. Database Cleanup
    print("Cleaning up verification data from database...")
    db = SessionLocal()
    try:
        db.query(AnalysisRun).filter_by(id=run_id).delete()
        db.query(SessionModel).filter_by(id=session_id).delete()
        db.query(User).filter_by(email=email).delete()
        db.commit()
        print("Database cleaned up successfully.")
    except Exception as e:
        print(f"Warning during cleanup: {e}")
    finally:
        db.close()
        
    print(f"SUCCESSFULLY VERIFIED {csv_name}!\n")
    return True

def main():
    datasets = [
        "Practical_SME_Quarterly_Avg.csv",
        "High_Risk_full_dataset.csv",
        "Realistic_JCurve_Growth_dataset.csv"
    ]
    
    results = {}
    for ds in datasets:
        success = verify_dataset(ds)
        results[ds] = success
        
    print("=" * 80)
    print("FINAL INTEGRATION VERIFICATION SUMMARY")
    print("=" * 80)
    all_success = True
    for ds, success in results.items():
        status = "PASSED" if success else "FAILED"
        print(f"  - {ds}: {status}")
        if not success:
            all_success = False
            
    if all_success:
        print("\nALL DATASETS AND REPORT GENERATION VERIFIED SUCCESSFULLY!")
        return 0
    else:
        print("\nSOME DATASETS OR REPORT GENERATION FAILED VERIFICATION.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
