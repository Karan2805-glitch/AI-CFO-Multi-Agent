from app.services.preprocessing import preprocess
from app.services.kpi_service import calculate_kpis
from app.services.ratio_service import calculate_ratios

def analyze(file):
    # Step 1: Preprocess
    df = preprocess(file)

    # Step 2: KPI Calculation
    kpis = calculate_kpis(df)

    # Step 3: Ratio Calculation
    ratios = calculate_ratios(kpis)

    return {
        "kpi": kpis,
        "ratios": ratios
    }

if __name__ == "__main__":
    result = analyze("app/services/sample.csv")
    print(result)