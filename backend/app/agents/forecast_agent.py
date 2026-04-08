import numpy as np

def forecast_revenue(df, periods=3):
    revenues = df["revenue"].values

    if len(revenues) < 2:
        return []

    x = np.arange(len(revenues))
    y = revenues

    m, c = np.polyfit(x, y, 1)

    forecasts = []
    last_index = len(revenues)

    for i in range(1, periods + 1):
        future_x = last_index + i - 1
        pred = m * future_x + c
        forecasts.append(round(float(pred), 2))

    return forecasts


def prepare_forecast_output(df, forecast_values):
    historical = df["revenue"].tolist()

    return {
        "historical": historical,
        "forecast": forecast_values
    }