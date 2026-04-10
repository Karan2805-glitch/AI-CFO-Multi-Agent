import pandas as pd
from app.services.analysis_service import analyze

try:
    df = pd.read_csv("app/dem.csv") # I need to check the actual sample.csv or dem.csv
    res = analyze(df)
    print("SUCCESS!")
    print(f"Health: {res['health_score']}")
    print(f"Recommendations: {len(res['recommendations']['recommendations'])}")
    print(f"Forecast length: {len(res['forecast']['forecast'])}")
except Exception as e:
    print(f"FAILED: {e}")
