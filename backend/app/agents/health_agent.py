def calculate_health_score(df, kpis, ratios, risk):
    profit_margin = kpis["profit_margin"]
    risk_level = risk["risk_level"]

    revenue = df["revenue"]

    # 🔹 Profitability Score (0–40)
    if profit_margin > 20:
        profitability = 40
    elif profit_margin > 10:
        profitability = 25
    else:
        profitability = 10

    # 🔹 Stability Score (0–30)
    if len(revenue) > 1:
        volatility = revenue.pct_change().std()
        if volatility < 0.1:
            stability = 30
        elif volatility < 0.25:
            stability = 20
        else:
            stability = 10
    else:
        stability = 15

    # 🔹 Efficiency Score (0–30)
    total_exp_ratio = ratios["total_expense_ratio"]
    if total_exp_ratio < 60:
        efficiency = 30
    elif total_exp_ratio < 80:
        efficiency = 20
    else:
        efficiency = 10

    # 🔹 Risk Penalty
    if risk_level == "LOW":
        penalty = 0
    elif risk_level == "MEDIUM":
        penalty = -5
    elif risk_level == "HIGH":
        penalty = -10
    else:
        penalty = -20

    score = profitability + stability + efficiency + penalty

    return max(0, min(100, int(score)))