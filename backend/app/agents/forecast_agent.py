# NOTE:
# Currently using fixed ARIMA(1,1,1).
# In production, Prophet or auto_arima can be used for dynamic parameter selection.
import pandas as pd
import numpy as np
from app.core.response_models import AgentResponse, AgentFinding, AgentWarning

try:
    from sklearn.linear_model import LinearRegression
    SKLEARN_AVAILABLE = True
except Exception:
    LinearRegression = None
    SKLEARN_AVAILABLE = False

# Optional Prophet import
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except Exception:
    PROPHET_AVAILABLE = False

# Optional ARIMA import
try:
    from statsmodels.tsa.arima.model import ARIMA
    ARIMA_AVAILABLE = True
except Exception:
    ARIMA_AVAILABLE = False


# -------------------------------
# 🔹 Prophet Forecast (ADVANCED ML)
# -------------------------------
def forecast_revenue_prophet(df, periods=3):
    if not PROPHET_AVAILABLE or "months" not in df.columns:
        return []

    try:
        # Prophet expects 'ds' and 'y'
        p_df = df[["months", "revenue"]].rename(columns={"months": "ds", "revenue": "y"})
        # Remove timezone if any, as Prophet struggles with timezone-aware series
        if pd.api.types.is_datetime64tz_dtype(p_df['ds']):
            p_df['ds'] = p_df['ds'].dt.tz_localize(None)
            
        model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
        model.fit(p_df)
        
        future = model.make_future_dataframe(periods=periods, freq='MS')
        forecast = model.predict(future)
        
        # Extract only the future predicted steps
        future_preds = forecast['yhat'].tail(periods).tolist()
        return [round(max(0.0, float(v)), 2) for v in future_preds]
    except Exception as e:
        print(f"Prophet forecast failed: {e}")
        return []


# -------------------------------
# 🔹 Linear Regression Forecast (SAFE BASELINE)
# -------------------------------
def forecast_revenue_ml(df, periods=3):
    revenues = df["revenue"].values

    if len(revenues) < 2:
        return []

    X = np.arange(len(revenues)).reshape(-1, 1)
    y = revenues

    forecasts = []
    last_index = len(revenues)

    if SKLEARN_AVAILABLE:
        model = LinearRegression()
        model.fit(X, y)

        for i in range(1, periods + 1):
            future_x = np.array([[last_index + i - 1]])
            pred = model.predict(future_x)[0]
            forecasts.append(round(max(0.0, float(pred)), 2))
    else:
        slope, intercept = np.polyfit(np.arange(len(revenues)), y, 1)

        for i in range(1, periods + 1):
            future_index = last_index + i - 1
            pred = slope * future_index + intercept
            forecasts.append(round(max(0.0, float(pred)), 2))

    return forecasts


# -------------------------------
# 🔹 ARIMA Forecast (ADVANCED - WITH TRY/CATCH)
# -------------------------------
def forecast_revenue_arima(df, periods=3):
    if not ARIMA_AVAILABLE:
        return []

    try:
        series = df["revenue"].reset_index(drop=True)

        # Basic ARIMA config (safe default)
        model = ARIMA(series, order=(1, 1, 1))
        model_fit = model.fit()

        forecast = model_fit.forecast(steps=periods)
        values = [round(max(0.0, float(v)), 2) for v in forecast]

        # Detect degenerate output: if all values are nearly identical
        # (ARIMA converges to constant on short series), reject and fallback
        if len(values) >= 2:
            spread = max(values) - min(values)
            avg = sum(abs(v) for v in values) / len(values) if values else 1
            if avg > 0 and spread / avg < 0.01:
                return []  # Flat prediction — let linear regression handle it

        return values

    except Exception:
        return []


# -------------------------------
# 🔹 MAIN FORECAST FUNCTION (WITH FALLBACK)
# -------------------------------
def generate_forecast(df, periods=3):
    """
    Try Prophet first → fallback to ARIMA → fallback to Linear Regression
    """
    forecast_values = []
    model_used = None
    
    # Try Prophet first
    if PROPHET_AVAILABLE:
        forecast_values = forecast_revenue_prophet(df, periods)
        if forecast_values:
            model_used = "PROPHET"
        
    # Then ARIMA (skip for very short series where ARIMA is unreliable)
    if not forecast_values and ARIMA_AVAILABLE and len(df) >= 6:
        forecast_values = forecast_revenue_arima(df, periods)
        if forecast_values:
            model_used = "ARIMA"

    # Fallback to ML Baseline
    if not forecast_values:
        forecast_values = forecast_revenue_ml(df, periods)
        model_used = "LINEAR_REGRESSION"

    return forecast_values, model_used


# -------------------------------
# 🔹 OUTPUT FORMAT (FOR FRONTEND GRAPH)
# -------------------------------
def _safe_float_list(values):
    cleaned = []
    for value in values:
        if pd.isna(value):
            continue
        cleaned.append(round(float(value), 2))
    return cleaned


def _calculate_trend(revenues):
    if len(revenues) < 2:
        return "STABLE", 0.0

    x = np.arange(len(revenues))
    slope = float(np.polyfit(x, revenues, 1)[0])
    avg_revenue = max(abs(float(np.mean(revenues))), 1.0)
    normalized_slope = slope / avg_revenue

    if normalized_slope > 0.01:
        return "UPWARD", normalized_slope
    if normalized_slope < -0.01:
        return "DOWNWARD", normalized_slope
    return "STABLE", normalized_slope


def _calculate_growth_rate(revenues):
    if len(revenues) < 2:
        return 0.0, "+0.0%"

    first = float(revenues[0])
    last = float(revenues[-1])

    if first == 0:
        growth_rate = 0.0 if last == 0 else 100.0
    else:
        growth_rate = ((last - first) / abs(first)) * 100

    sign = "+" if growth_rate >= 0 else ""
    return growth_rate, f"{sign}{growth_rate:.1f}%"


def _calculate_volatility(revenues):
    if len(revenues) < 3:
        return 0.0, "LOW"

    pct_changes = (
        pd.Series(revenues)
        .pct_change()
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )

    volatility_score = 0.0 if pct_changes.empty else float(pct_changes.std())

    if volatility_score < 0.1:
        return volatility_score, "LOW"
    if volatility_score < 0.25:
        return volatility_score, "MEDIUM"
    return volatility_score, "HIGH"


def _calculate_direction_changes(revenues):
    if len(revenues) < 3:
        return 0.0

    diffs = np.diff(revenues)
    non_zero_diffs = diffs[diffs != 0]

    if len(non_zero_diffs) < 2:
        return 0.0

    direction_changes = np.sum(np.sign(non_zero_diffs[1:]) != np.sign(non_zero_diffs[:-1]))
    return float(direction_changes / (len(non_zero_diffs) - 1))


def _calculate_forecast_smoothness(forecast_values):
    if len(forecast_values) < 3:
        return 0.0

    pct_changes = (
        pd.Series(forecast_values)
        .pct_change()
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )

    return 0.0 if pct_changes.empty else float(pct_changes.std())


def _recent_revenue_collapse(revenues):
    if len(revenues) < 2:
        return False

    previous = float(revenues[-2])
    current = float(revenues[-1])

    return previous > 0 and ((previous - current) / previous) > 0.3


def _calculate_confidence(
    revenues,
    trend,
    volatility_label,
    volatility_score,
    direction_change_ratio,
    forecast_smoothness,
):
    confidence = 0.85

    if volatility_label == "HIGH":
        confidence -= 0.20
    elif volatility_label == "MEDIUM":
        confidence -= 0.08

    if len(revenues) < 3:
        confidence -= 0.25
    elif len(revenues) < 6:
        confidence -= 0.15

    if direction_change_ratio > 0.5:
        confidence -= 0.10

    if forecast_smoothness >= 0.25:
        confidence -= 0.10
    elif forecast_smoothness >= 0.1:
        confidence -= 0.05

    if _recent_revenue_collapse(revenues):
        confidence -= 0.12

    if trend == "STABLE" and volatility_score < 0.1 and len(revenues) >= 6:
        confidence += 0.05

    return round(float(min(max(confidence, 0.0), 1.0)), 2)


def _build_scenarios(forecast_values, volatility_label):
    expected = _safe_float_list(forecast_values)

    scenario_adjustment = {
        "LOW": 0.08,
        "MEDIUM": 0.12,
        "HIGH": 0.15,
    }.get(volatility_label, 0.1)

    return {
        "expected": expected,
        "optimistic": [round(max(0.0, float(value) * (1 + scenario_adjustment)), 2) for value in expected],
        "pessimistic": [round(max(0.0, float(value) * (1 - scenario_adjustment)), 2) for value in expected],
    }


def _build_warnings(revenues, volatility_label, confidence):
    warnings = []

    if volatility_label == "HIGH":
        warnings.append(
            AgentWarning(
                message="Forecast reliability reduced due to high revenue volatility.",
                impact="HIGH"
            )
        )
    elif volatility_label == "MEDIUM":
        warnings.append(
            AgentWarning(
                message="Moderate revenue volatility may affect forecast precision.",
                impact="MEDIUM"
            )
        )

    if len(revenues) < 6:
        warnings.append(
            AgentWarning(
                message="Limited historical data may reduce forecast accuracy.",
                impact="MEDIUM"
            )
        )

    if _recent_revenue_collapse(revenues):
        warnings.append(
            AgentWarning(
                message="Recent revenue collapse impacts forecast confidence.",
                impact="HIGH"
            )
        )

    if confidence < 0.55:
        warnings.append(
            AgentWarning(
                message="Forecast confidence is below preferred planning threshold.",
                impact="HIGH"
            )
        )

    return warnings


def _build_reasoning(
    volatility_label,
    direction_change_ratio,
    forecast_smoothness,
    confidence,
):
    reasoning = [
        "Trend derived from normalized revenue slope analysis.",
        "Growth rate calculated from first and latest historical revenue points.",
        "Volatility classified from the standard deviation of revenue percentage changes.",
        "Scenario forecasts adjusted according to volatility classification.",
        "Forecast reliability evaluated using trend consistency and historical stability.",
    ]

    if volatility_label in ["MEDIUM", "HIGH"]:
        reasoning.append("Confidence reduced due to elevated revenue volatility.")

    if direction_change_ratio > 0.5:
        reasoning.append("Confidence reduced because historical revenue direction changed frequently.")

    if forecast_smoothness >= 0.1:
        reasoning.append("Confidence adjusted because forecast period changes are uneven.")

    if confidence < 0.55:
        reasoning.append("Forecast confidence is below preferred planning threshold.")

    return reasoning


def _build_summary(trend, volatility_label, growth_rate, confidence):
    growth_direction = "growth" if growth_rate >= 0 else "contraction"

    if confidence < 0.55:
        confidence_phrase = "elevated uncertainty"
    elif confidence < 0.75:
        confidence_phrase = "moderate confidence"
    else:
        confidence_phrase = "solid confidence"

    if trend == "UPWARD":
        trend_phrase = "upward revenue momentum"
    elif trend == "DOWNWARD":
        trend_phrase = "downward revenue pressure"
    else:
        trend_phrase = "stable revenue behavior"

    volatility_phrase = {
        "LOW": "low volatility",
        "MEDIUM": "manageable volatility",
        "HIGH": "elevated volatility",
    }.get(volatility_label, "unclear volatility")

    return (
        f"Revenue projections indicate {trend_phrase} with {volatility_phrase}. "
        f"Historical revenue shows {abs(growth_rate):.1f}% {growth_direction}, "
        f"producing {confidence_phrase} in the near-term forecast."
    )


def _severity_for_trend(trend, growth_rate):
    if trend == "DOWNWARD" and growth_rate < -10:
        return "HIGH"
    if trend == "DOWNWARD" or growth_rate < 0:
        return "MEDIUM"
    return "INFO"


def prepare_forecast_output(df, forecast_values, model_used="UNKNOWN") -> AgentResponse:
    historical = _safe_float_list(df["revenue"].tolist())
    
    cost_cols = [c for c in df.columns if c not in ["months", "date", "revenue"]]
    expenses = _safe_float_list(df[cost_cols].sum(axis=1).tolist()) if cost_cols else [0.0 for _ in historical]
    forecast = _safe_float_list(forecast_values)

    trend, _ = _calculate_trend(historical)
    growth_rate, formatted_growth_rate = _calculate_growth_rate(historical)
    volatility_score, volatility_label = _calculate_volatility(historical)
    direction_change_ratio = _calculate_direction_changes(historical)
    forecast_smoothness = _calculate_forecast_smoothness(forecast)
    confidence = _calculate_confidence(
        historical,
        trend,
        volatility_label,
        volatility_score,
        direction_change_ratio,
        forecast_smoothness,
    )
    scenarios = _build_scenarios(forecast, volatility_label)

    projected_contraction = len(forecast) >= 2 and forecast[-1] < forecast[0]
    forecast_outlook = (
        "Projected revenue contraction detected over next forecast periods."
        if projected_contraction
        else "Projected revenue is stable or expanding over next forecast periods."
    )

    findings = [
        AgentFinding(
            title="Revenue Trend",
            description=f"Revenue trend classified as {trend}.",
            severity=_severity_for_trend(trend, growth_rate)
        ),
        AgentFinding(
            title="Revenue Growth",
            description=f"Historical revenue growth rate is {formatted_growth_rate}.",
            severity="MEDIUM" if growth_rate < 0 else "INFO"
        ),
        AgentFinding(
            title="Revenue Volatility",
            description=f"Revenue volatility classified as {volatility_label}.",
            severity="HIGH" if volatility_label == "HIGH" else "MEDIUM" if volatility_label == "MEDIUM" else "INFO"
        ),
        AgentFinding(
            title="Forecast Outlook",
            description=forecast_outlook,
            severity="MEDIUM" if projected_contraction else "INFO"
        ),
    ]

    return AgentResponse(
        agent="forecast_agent",
        confidence=confidence,
        summary=_build_summary(trend, volatility_label, growth_rate, confidence),
        findings=findings,
        warnings=_build_warnings(historical, volatility_label, confidence),
        reasoning=_build_reasoning(
            volatility_label,
            direction_change_ratio,
            forecast_smoothness,
            confidence,
        ),
        metadata={
            "model_used": model_used,
            "forecast_periods": len(forecast),
            "historical_points": len(historical),
            "volatility_score": round(volatility_score, 4),
        },
        raw_data={
            "historical": historical,
            "historical_expenses": expenses,
            "forecast": forecast,
            "trend": trend,
            "growth_rate": {
                "value": round(float(growth_rate), 4),
                "formatted": formatted_growth_rate,
            },
            "growth_rate_display": formatted_growth_rate,
            "volatility": volatility_label,
            "scenarios": scenarios
        }
    )
