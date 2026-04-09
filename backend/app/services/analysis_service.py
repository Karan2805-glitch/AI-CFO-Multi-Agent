from app.services.preprocessing import preprocess
from app.services.kpi_service import calculate_kpis
from app.services.ratio_service import calculate_ratios
from app.agents.risk_agent import assess_risk
from app.agents.recommendation_agent import generate_recommendations
from app.agents.auditor_agent import generate_explanation
from app.agents.health_agent import calculate_health_score
from app.agents.forecast_agent import forecast_revenue, prepare_forecast_output

def analyze(df):
    # Step 1: Preprocess
    df = preprocess(df)
    df.columns = [col.strip().lower() for col in df.columns]
    # Step 2: KPI Calculation
    kpis = calculate_kpis(df)

    # Step 3: Ratio Calculation
    ratios = calculate_ratios(kpis)

    # Step 4: Risk Agent
    risk = assess_risk(kpis, ratios)

    # Step 5: Recommendation Agent
    recommendations = generate_recommendations(kpis, ratios, risk)

    # Step 6: Auditor Agent
    auditor = generate_explanation(kpis, ratios, risk, recommendations["recommendations"])

    # Step 7: Health Agent
    health_score = calculate_health_score(kpis, risk)

    # Step 8: Forecasting Agent
    forecast_values = forecast_revenue(df)
    forecast_data = prepare_forecast_output(df, forecast_values)

    return {
    "kpi": kpis,
    "ratios": ratios,
    "risk": risk,
    "recommendations": recommendations,
    "health_score": health_score,
    "auditor": auditor,
    "forecast": forecast_data
}

# if __name__ == "__main__":
#     import pandas as pd

#     df = pd.read_csv("app/services/sample.csv")
#     result = analyze(df)
#     print(result)