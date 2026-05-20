import re

file_path = r'd:\Mini Project\First Review\AI-CFO-Multi-Agent\backend\app\agents\forecast_agent.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = r'def prepare_forecast_output\(df, forecast_values\):.*?return \{(.*?)\}'

replacement = '''def prepare_forecast_output(df, forecast_values) -> AgentResponse:
    historical = [float(v) for v in df["revenue"].tolist()]
    
    cost_cols = [c for c in df.columns if c not in ["months", "date", "revenue"]]
    expenses = [float(v) for v in df[cost_cols].sum(axis=1).tolist()]

    return AgentResponse(
        agent="forecast_agent",
        confidence=0.75,
        summary=f"Forecasted {len(forecast_values)} periods.",
        findings=[
            AgentFinding(
                title="Revenue Forecast",
                description=f"Predicted revenues: {forecast_values}",
                severity="INFO"
            )
        ],
        raw_data={
            "historical": historical,
            "historical_expenses": expenses,
            "forecast": forecast_values
        }
    )'''

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
