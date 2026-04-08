def max_risk(current, new):
    levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    return levels[max(levels.index(current), levels.index(new))]


def assess_risk(kpis, ratios):
    risk_flags = []
    risk_level = "LOW"

    profit_margin = kpis["profit_margin"]
    total_exp_ratio = ratios["total_expense_ratio"]
    expense_ratios = ratios["expense_ratios"]

    # 🔴 Profitability Risk
    if profit_margin < 0:
        risk_flags.append("Company is running at a loss")
        risk_level = "CRITICAL"

    elif profit_margin < 10:
        risk_flags.append("Low profit margin")
        risk_level = "HIGH"

    elif profit_margin < 20:
        risk_flags.append("Moderate profit margin")
        risk_level = "MEDIUM"

    # ⚠️ Expense Pressure
    if total_exp_ratio > 80:
        risk_flags.append("Expenses are too high compared to revenue")
        risk_level = max_risk(risk_level, "HIGH")

    # 📉 Category Risks
    if expense_ratios.get("marketing_ratio", 0) > 25:
        risk_flags.append("High marketing spend")

    if expense_ratios.get("rent_ratio", 0) > 30:
        risk_flags.append("High fixed cost (rent)")

    return {
        "risk_level": risk_level,
        "risk_flags": risk_flags
    }