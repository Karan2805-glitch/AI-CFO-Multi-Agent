from app.services.preprocessing import preprocess

def calculate_total_revenue(df):
    return df["revenue"].sum()

IGNORED_EXPENSE_COLS = ["months", "revenue", "total_expenses", "net_profit", "archetype", "profit", "margin", "health_score", "risk_level"]

def calculate_total_expenses(df):
    expense_cols = [c for c in df.columns if c not in IGNORED_EXPENSE_COLS]
    return df[expense_cols].sum().sum()

def calculate_profit(total_revenue, total_expenses):
    return total_revenue - total_expenses

def calculate_profit_margin(profit, revenue):
    if revenue == 0:
        return 0
    return (profit / revenue) * 100

def calculate_avg_revenue(df):
    return df["revenue"].mean()

def calculate_expense_breakdown(df):
    expense_cols = [c for c in df.columns if c not in IGNORED_EXPENSE_COLS]
    return df[expense_cols].sum().to_dict()

def calculate_kpis(df):
    total_revenue = calculate_total_revenue(df)
    total_expenses = calculate_total_expenses(df)
    profit = calculate_profit(total_revenue, total_expenses)
    profit_margin = calculate_profit_margin(profit, total_revenue)
    avg_revenue = calculate_avg_revenue(df)
    expense_breakdown = calculate_expense_breakdown(df)

    return {
    "total_revenue": int(total_revenue),
    "total_expenses": float(total_expenses),
    "profit": float(profit),
    "profit_margin": float(round(profit_margin, 2)),
    "avg_monthly_revenue": float(round(avg_revenue, 2)),
    "expense_breakdown": {k: float(v) for k, v in expense_breakdown.items()}
    }


# if __name__ == "__main__":
#     df = preprocess("app/services/sample.csv")
#     kpis = calculate_kpis(df)
#     print(kpis)