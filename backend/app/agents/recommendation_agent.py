def generate_recommendations(kpis, ratios, risk, df=None):
    recommendations = []

    profit_margin = kpis["profit_margin"]
    total_exp_ratio = ratios["total_expense_ratio"]
    expense_ratios = ratios["expense_ratios"]
    risk_flags = risk["risk_flags"]

    # 🔴 Profitability Issues
    if profit_margin < 10:
        recommendations.append(
            "Improve profitability by reducing operational costs or increasing revenue streams"
        )

    # ⚠️ High Expenses
    if total_exp_ratio > 80:
        recommendations.append(
            "Overall expenses are too high; consider cost-cutting strategies across departments"
        )

    # 📉 Category-Level Recommendations
    if expense_ratios.get("marketing_ratio", 0) > 25:
        recommendations.append(
            "Optimize marketing spend to improve return on investment"
        )

    if expense_ratios.get("rent_ratio", 0) > 30:
        recommendations.append(
            "Consider reducing fixed costs such as rent or relocating to a more cost-effective space"
        )

    if expense_ratios.get("salaries_ratio", 0) > 40:
        recommendations.append(
            "Evaluate workforce efficiency and optimize salary expenses"
        )

    # 🧠 Risk-Based Reinforcement
    if risk["risk_level"] in ["HIGH", "CRITICAL"]:
        recommendations.append(
            "Immediate financial restructuring is recommended due to high risk levels"
        )

    # 📈 ML Correlation Growth Insights
    if df is not None and len(df) >= 3 and "revenue" in df.columns:
        numeric_df = df.select_dtypes(include=['number'])
        if not numeric_df.empty:
            corrs = numeric_df.corr(numeric_only=True).get("revenue", {})
            for col, corr_val in corrs.items():
                if col != "revenue" and corr_val > 0.8:
                    capitalized = col.replace("_", " ").title()
                    recommendations.append(
                        f"Machine Learning insight: {capitalized} shows a direct, positive correlation (>80%) with revenue growth. Consider strategic budget increases here."
                    )

    # ✅ If everything is good
    if not recommendations:
        recommendations.append(
            "Financial health is stable. Maintain current strategy while exploring growth opportunities"
        )

    return {
        "recommendations": recommendations
    }