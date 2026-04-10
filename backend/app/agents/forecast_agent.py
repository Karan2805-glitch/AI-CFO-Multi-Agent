# NOTE:
# Currently using fixed ARIMA(1,1,1).
# In production, Prophet or auto_arima can be used for dynamic parameter selection.
import pandas as pd
import numpy as np

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
        return [round(float(v), 2) for v in future_preds]
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
            forecasts.append(round(float(pred), 2))
    else:
        slope, intercept = np.polyfit(np.arange(len(revenues)), y, 1)

        for i in range(1, periods + 1):
            future_index = last_index + i - 1
            pred = slope * future_index + intercept
            forecasts.append(round(float(pred), 2))

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

        return [round(float(v), 2) for v in forecast]

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
    
    # Try Prophet first
    if PROPHET_AVAILABLE:
        forecast_values = forecast_revenue_prophet(df, periods)
        
    # Then ARIMA
    if not forecast_values and ARIMA_AVAILABLE:
        forecast_values = forecast_revenue_arima(df, periods)

    # Fallback to ML Baseline
    if not forecast_values:
        forecast_values = forecast_revenue_ml(df, periods)

    return forecast_values


# -------------------------------
# 🔹 OUTPUT FORMAT (FOR FRONTEND GRAPH)
# -------------------------------
def prepare_forecast_output(df, forecast_values):
    historical = [float(v) for v in df["revenue"].tolist()]
    
    cost_cols = [c for c in df.columns if c not in ["months", "date", "revenue"]]
    expenses = [float(v) for v in df[cost_cols].sum(axis=1).tolist()]

    return {
        "historical": historical,
        "historical_expenses": expenses,
        "forecast": forecast_values
    }
