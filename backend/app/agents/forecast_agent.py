import numpy as np
from sklearn.linear_model import LinearRegression

# Optional ARIMA import
try:
    from statsmodels.tsa.arima.model import ARIMA
    ARIMA_AVAILABLE = True
except Exception:
    ARIMA_AVAILABLE = False


# -------------------------------
# 🔹 Linear Regression Forecast (SAFE BASELINE)
# -------------------------------
def forecast_revenue_ml(df, periods=3):
    revenues = df["revenue"].values

    if len(revenues) < 2:
        return []

    X = np.arange(len(revenues)).reshape(-1, 1)
    y = revenues

    model = LinearRegression()
    model.fit(X, y)

    forecasts = []
    last_index = len(revenues)

    for i in range(1, periods + 1):
        future_x = np.array([[last_index + i - 1]])
        pred = model.predict(future_x)[0]
        forecasts.append(round(float(pred), 2))

    return forecasts


# -------------------------------
# 🔹 ARIMA Forecast (ADVANCED - WITH TRY/CATCH)
# -------------------------------
def forecast_revenue_arima(df, periods=3):
    if not ARIMA_AVAILABLE:
        return []

    try:
        series = df["revenue"]

        # Basic ARIMA config (safe default)
        model = ARIMA(series, order=(1, 1, 1))
        model_fit = model.fit()

        forecast = model_fit.forecast(steps=periods)

        return [round(float(v), 2) for v in forecast]

    except Exception:
        return []


# -------------------------------
# 🔹 MAIN FORECAST FUNCTION (WITH FALLBACK)
# -------------------------------
def generate_forecast(df, periods=3):
    """
    Try ARIMA first → fallback to Linear Regression
    """

    # Try ARIMA
    forecast_values = forecast_revenue_arima(df, periods)

    # Fallback to ML model if ARIMA fails
    if not forecast_values:
        forecast_values = forecast_revenue_ml(df, periods)

    return forecast_values


# -------------------------------
# 🔹 OUTPUT FORMAT (FOR FRONTEND GRAPH)
# -------------------------------
def prepare_forecast_output(df, forecast_values):
    historical = [float(v) for v in df["revenue"].tolist()]

    return {
        "historical": historical,
        "forecast": forecast_values
    }