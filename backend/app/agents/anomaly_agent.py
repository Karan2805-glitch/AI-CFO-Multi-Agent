import numpy as np

# Try importing ML model
try:
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False


# -------------------------------
# 🔹 ML-Based Anomaly Detection (Isolation Forest)
# -------------------------------
def detect_anomalies_ml(df):
    try:
        # Use key financial features
        expense_cols = df.columns.drop(["date", "revenue"], errors="ignore")
        features = df[["revenue"] + list(expense_cols)]
        model = IsolationForest(contamination=0.2, random_state=42)
        preds = model.fit_predict(features)

        anomalies = []
        for i, val in enumerate(preds):
            if val == -1:
                anomalies.append(f"Anomaly detected at row {i}")

        return anomalies

    except Exception:
        return []


# -------------------------------
# 🔹 Rule-Based Fallback (SAFE)
# -------------------------------
def detect_anomalies_rule(df):
    anomalies = []

    # Revenue drop detection
    if len(df) > 1:
        prev = df["revenue"].iloc[-2]
        curr = df["revenue"].iloc[-1]

        if prev > 0 and ((prev - curr) / prev) > 0.3:
            anomalies.append("Significant revenue drop detected")

    return anomalies


# -------------------------------
# 🔹 MAIN FUNCTION (WITH FALLBACK)
# -------------------------------
def detect_anomalies(df):
    """
    Try ML model → fallback to rule-based detection
    """

    anomalies = []

    if ML_AVAILABLE:
        anomalies = detect_anomalies_ml(df)

    # fallback if ML fails or no anomalies found
    if not anomalies:
        anomalies = detect_anomalies_rule(df)

    return anomalies