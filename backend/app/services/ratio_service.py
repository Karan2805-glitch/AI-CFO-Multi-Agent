def calculate_expense_ratios(expense_breakdown, total_revenue):
    ratios = {}

    if total_revenue == 0:
        return {f"{k}_ratio": 0 for k in expense_breakdown}

    for category, value in expense_breakdown.items():
        safe_value = value if value is not None else 0

        try:
            safe_value = float(safe_value)
        except:
            safe_value = 0

        ratios[f"{category}_ratio"] = round((safe_value / total_revenue) * 100, 2)

    return ratios

def get_profit_margin(kpis):
    return kpis.get("profit_margin", 0)

def calculate_total_expense_ratio(total_expenses, revenue):
    try:
        total_expenses = float(total_expenses)
        revenue = float(revenue)
    except:
        return 0

    if revenue == 0:
        return 0

    return round((total_expenses / revenue) * 100, 2)

def calculate_ratios(kpis):

    total_revenue = kpis.get("total_revenue", 0)
    total_expenses = kpis.get("total_expenses", 0)
    expense_breakdown = kpis.get("expense_breakdown", {})

    # ---- Safety: ensure dict ----
    if not isinstance(expense_breakdown, dict):
        expense_breakdown = {}

    expense_ratios = calculate_expense_ratios(expense_breakdown, total_revenue)
    total_exp_ratio = calculate_total_expense_ratio(total_expenses, total_revenue)
    profit_margin = get_profit_margin(kpis)

    return {
        "expense_ratios": expense_ratios,
        "total_expense_ratio": total_exp_ratio,
        "profit_margin": profit_margin
    }

# if __name__ == "__main__":
#     from app.services.preprocessing import preprocess
#     from app.services.kpi_service import calculate_kpis

#     df = preprocess("app/services/sample.csv")
#     kpis = calculate_kpis(df)
#     ratios = calculate_ratios(kpis)

#     print(ratios)