# Try importing ML model
try:
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except Exception:
    IsolationForest = None
    ML_AVAILABLE = False


# -------------------------------
# 🔹 ML-Based Anomaly Detection (Isolation Forest)
# -------------------------------
def detect_anomalies_ml(df):
    if not ML_AVAILABLE or "revenue" not in df.columns:
        return None

    try:
        excluded_cols = {"months", "date"}
        feature_cols = [
            col for col in df.columns
            if col not in excluded_cols and df[col].dtype.kind in "biufc"
        ]

        if "revenue" not in feature_cols:
            feature_cols.insert(0, "revenue")

        if len(feature_cols) < 1 or len(df) < 2:
            return []

        features = df[feature_cols]
        model = IsolationForest(contamination=0.2, random_state=42)
        preds = model.fit_predict(features)

        anomalies = []
        for i, val in enumerate(preds):
            if val == -1:
                anomalies.append(f"Anomaly detected at row {i}")

        return anomalies

    except Exception:
        return None


# -------------------------------
# 🔹 Rule-Based Fallback (SAFE)
# -------------------------------
def detect_anomalies_rule(df):
    anomalies = []

    # Revenue drop detection
    if "revenue" in df.columns and len(df) > 1:
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

    anomalies = detect_anomalies_ml(df)

    if anomalies is not None:
        return anomalies

    return detect_anomalies_rule(df)
