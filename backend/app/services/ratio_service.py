def calculate_expense_ratios(expense_breakdown, total_revenue):
    ratios = {}

    if total_revenue == 0:
        return {k: 0 for k in expense_breakdown}

    for category, value in expense_breakdown.items():
        ratios[f"{category}_ratio"] = round((value / total_revenue) * 100, 2)

    return ratios

def get_profit_margin(kpis):
    return kpis["profit_margin"]

def calculate_total_expense_ratio(total_expenses, revenue):
    if revenue == 0:
        return 0
    return round((total_expenses / revenue) * 100, 2)

def calculate_ratios(kpis):
    total_revenue = kpis["total_revenue"]
    total_expenses = kpis["total_expenses"]
    expense_breakdown = kpis["expense_breakdown"]

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