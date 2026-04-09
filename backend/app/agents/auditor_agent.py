def generate_explanation(kpis, ratios, risk, recommendations):
    explanation_parts = []

    profit_margin = kpis["profit_margin"]
    total_exp_ratio = ratios["total_expense_ratio"]
    expense_ratios = ratios["expense_ratios"]
    risk_level = risk["risk_level"]

    # 📊 Profitability explanation
    explanation_parts.append(
        f"The company has a profit margin of {profit_margin}%, "
        f"with total expenses accounting for {total_exp_ratio}% of revenue."
    )

    # 📉 Highlight major cost drivers
    high_costs = [
        (k.replace("_ratio", ""), v)
        for k, v in expense_ratios.items()
        if v > 25
    ]

    if high_costs:
        cost_str = ", ".join([f"{name} ({value}%)" for name, value in high_costs])
        explanation_parts.append(
            f"Significant cost contributors include: {cost_str}."
        )

    # ⚠️ Risk reasoning
    explanation_parts.append(
        f"Based on these metrics, the system classified the financial risk as {risk_level}."
    )

    # 💡 Recommendation link
    if recommendations:
        explanation_parts.append(
            "Recommendations were generated to improve financial efficiency and reduce risk."
        )

    return {
    "summary": " ".join(explanation_parts),
    "details": explanation_parts  # optional, useful for UI sections
    }