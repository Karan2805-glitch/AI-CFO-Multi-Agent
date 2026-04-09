def calculate_health_score(kpis, risk):
    profit_margin = kpis["profit_margin"]
    risk_level = risk["risk_level"]

    score = 50  # base

    # Profit contribution
    if profit_margin > 20:
        score += 30
    elif profit_margin > 10:
        score += 15
    else:
        score -= 10

    # Risk penalty
    if risk_level == "LOW":
        score += 20
    elif risk_level == "MEDIUM":
        score += 10
    elif risk_level == "HIGH":
        score -= 10
    else:
        score -= 20

    return max(0, min(100, score))