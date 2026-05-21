import numpy as np
import pandas as pd

from app.core.response_models import AgentResponse, AgentFinding, AgentWarning

# Try importing ML model
try:
    from sklearn.ensemble import IsolationForest
    ML_AVAILABLE = True
except Exception:
    IsolationForest = None
    ML_AVAILABLE = False


# -------------------------------
# ML-Based Anomaly Detection (Isolation Forest)
# -------------------------------
def detect_anomalies_ml(df):
    if not ML_AVAILABLE or "revenue" not in df.columns:
        return None

    try:
        feature_cols = _numeric_feature_columns(df)

        if len(feature_cols) < 1 or len(df) < 2:
            return []

        features = df[feature_cols]
        model = IsolationForest(contamination=0.2, random_state=42)
        preds = model.fit_predict(features)

        return [i for i, val in enumerate(preds) if val == -1]

    except Exception:
        return None


# -------------------------------
# Rule-Based Fallback (SAFE)
# -------------------------------
def detect_anomalies_rule(df):
    anomalies = []

    # Revenue drop detection
    if "revenue" in df.columns and len(df) > 1:
        prev = float(df["revenue"].iloc[-2])
        curr = float(df["revenue"].iloc[-1])

        if prev > 0 and ((prev - curr) / prev) > 0.3:
            anomalies.append(len(df) - 1)

    return anomalies


def _numeric_feature_columns(df):
    excluded_cols = {"months", "date"}
    feature_cols = [
        col for col in df.columns
        if col not in excluded_cols and df[col].dtype.kind in "biufc"
    ]

    if "revenue" in df.columns and "revenue" not in feature_cols:
        feature_cols.insert(0, "revenue")

    return feature_cols


def _expense_columns(df):
    excluded_cols = {"months", "date", "revenue"}
    return [
        col for col in df.columns
        if col not in excluded_cols and df[col].dtype.kind in "biufc"
    ]


def _time_period(df, index):
    if "months" in df.columns:
        value = df["months"].iloc[index]
        if not pd.isna(value):
            return pd.to_datetime(value).strftime("%b %Y")

    if "date" in df.columns:
        value = df["date"].iloc[index]
        if not pd.isna(value):
            return pd.to_datetime(value).strftime("%b %Y")

    return f"Reporting period {index + 1}"


def _safe_pct_change(current, baseline):
    current = float(current)
    baseline = float(baseline)

    if baseline == 0:
        if current == 0:
            return 0.0
        return 1.0

    return (current - baseline) / abs(baseline)


def _baseline(series, index):
    prior = series.iloc[max(0, index - 3):index]

    if len(prior) == 0:
        prior = series.drop(series.index[index])

    if len(prior) == 0:
        return float(series.iloc[index])

    return float(prior.mean())


def _series_volatility(series):
    pct_changes = (
        pd.Series(series)
        .pct_change()
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )

    return 0.0 if pct_changes.empty else float(pct_changes.std())


def _severity_from_impact(max_deviation, profitability_impact, affected_count):
    score = abs(max_deviation)

    if profitability_impact <= -0.4:
        score += 0.35
    elif profitability_impact <= -0.2:
        score += 0.2

    if affected_count >= 3:
        score += 0.15
    elif affected_count == 2:
        score += 0.08

    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.45:
        return "HIGH"
    if score >= 0.2:
        return "MEDIUM"
    return "LOW"


def _confidence_score(max_deviation, affected_count, volatility):
    confidence = 0.45
    confidence += min(abs(max_deviation) * 0.5, 0.35)
    confidence += min(affected_count * 0.07, 0.14)

    if volatility > 0.35:
        confidence -= 0.08
    elif volatility < 0.1:
        confidence += 0.05

    return round(float(min(max(confidence, 0.0), 1.0)), 2)


def _business_impact(anomaly_type, severity):
    if anomaly_type == "Revenue Collapse":
        return "Potential short-term cashflow instability and reduced forecast reliability."
    if anomaly_type == "Revenue Spike":
        return "Unusual revenue expansion may distort run-rate expectations if non-recurring."
    if anomaly_type == "Expense Surge":
        return "Elevated operational risk due to sudden expense expansion."
    if anomaly_type == "Profitability Deterioration":
        return "Margin pressure may reduce operating flexibility and cash generation."
    if anomaly_type == "Operational Cost Spike":
        return "Cost structure may be expanding faster than revenue support."
    if severity in ["HIGH", "CRITICAL"]:
        return "Material financial volatility may affect planning confidence."
    return "Deviation appears limited but should be monitored for persistence."


def _possible_causes(anomaly_type, largest_expense_col=None):
    causes_by_type = {
        "Revenue Collapse": [
            "Seasonal contraction",
            "Client churn",
            "Operational disruption",
        ],
        "Revenue Spike": [
            "One-time contract win",
            "Seasonal demand increase",
            "Accelerated collections",
        ],
        "Expense Surge": [
            "Vendor cost increase",
            "Marketing overspend",
            "Hiring expansion",
        ],
        "Profitability Deterioration": [
            "Revenue softness",
            "Cost overrun",
            "Pricing pressure",
        ],
        "Operational Cost Spike": [
            "Hiring expansion",
            "Vendor cost increase",
            "Discretionary spend increase",
        ],
        "Volatility Event": [
            "Seasonal movement",
            "Timing mismatch",
            "Unusual reporting-period activity",
        ],
    }
    causes = causes_by_type.get(anomaly_type, causes_by_type["Volatility Event"]).copy()

    if largest_expense_col:
        causes.append(f"Unusual {largest_expense_col.replace('_', ' ')} spending")

    return causes


def _recommended_action(anomaly_type):
    actions_by_type = {
        "Revenue Collapse": "Investigate sudden revenue contraction and review customer retention metrics.",
        "Revenue Spike": "Validate whether the revenue increase is recurring before updating plans.",
        "Expense Surge": "Audit operational expenditures and reassess discretionary spending.",
        "Profitability Deterioration": "Review margin drivers and isolate revenue versus cost pressure.",
        "Operational Cost Spike": "Review vendor, hiring, and operating cost changes for the period.",
        "Volatility Event": "Monitor the metric in the next reporting period and confirm whether it repeats.",
    }

    return actions_by_type.get(anomaly_type, actions_by_type["Volatility Event"])


def _classify_anomaly(df, index):
    expense_cols = _expense_columns(df)
    revenue = float(df["revenue"].iloc[index]) if "revenue" in df.columns else 0.0
    revenue_baseline = _baseline(df["revenue"], index) if "revenue" in df.columns else revenue
    revenue_deviation = _safe_pct_change(revenue, revenue_baseline)

    expenses = float(df[expense_cols].sum(axis=1).iloc[index]) if expense_cols else 0.0
    expense_series = df[expense_cols].sum(axis=1) if expense_cols else pd.Series([0.0] * len(df))
    expense_baseline = _baseline(expense_series, index)
    expense_deviation = _safe_pct_change(expenses, expense_baseline)

    profit = revenue - expenses
    profit_baseline = revenue_baseline - expense_baseline
    profit_deviation = _safe_pct_change(profit, profit_baseline)

    margin = (profit / revenue) if revenue else 0.0
    baseline_margin = (profit_baseline / revenue_baseline) if revenue_baseline else 0.0
    margin_change = margin - baseline_margin

    largest_expense_col = None
    largest_expense_deviation = 0.0
    for col in expense_cols:
        deviation = _safe_pct_change(df[col].iloc[index], _baseline(df[col], index))
        if abs(deviation) > abs(largest_expense_deviation):
            largest_expense_col = col
            largest_expense_deviation = deviation

    affected_metrics = []
    if abs(revenue_deviation) >= 0.2:
        affected_metrics.append("revenue")
    if abs(expense_deviation) >= 0.2:
        affected_metrics.append("expenses")
    if abs(profit_deviation) >= 0.2 or abs(margin_change) >= 0.1:
        affected_metrics.append("profitability")
    if largest_expense_col and abs(largest_expense_deviation) >= 0.3:
        affected_metrics.append(largest_expense_col)

    if revenue_deviation <= -0.25:
        anomaly_type = "Revenue Collapse"
        explanation = f"Revenue declined {abs(revenue_deviation) * 100:.1f}% below recent baseline."
    elif revenue_deviation >= 0.25:
        anomaly_type = "Revenue Spike"
        explanation = f"Revenue increased {revenue_deviation * 100:.1f}% above recent baseline."
    elif expense_deviation >= 0.25:
        anomaly_type = "Expense Surge"
        explanation = f"Total expenses increased {expense_deviation * 100:.1f}% above recent baseline."
    elif margin_change <= -0.1 or profit_deviation <= -0.25:
        anomaly_type = "Profitability Deterioration"
        explanation = f"Profitability weakened by {abs(margin_change) * 100:.1f} percentage points versus recent baseline."
    elif largest_expense_deviation >= 0.3:
        anomaly_type = "Operational Cost Spike"
        explanation = (
            f"{largest_expense_col.replace('_', ' ').title()} spending increased "
            f"{largest_expense_deviation * 100:.1f}% above recent baseline."
        )
    else:
        anomaly_type = "Volatility Event"
        explanation = "Financial activity deviated materially from historical spending and revenue patterns."

    max_deviation = max(
        abs(revenue_deviation),
        abs(expense_deviation),
        abs(profit_deviation),
        abs(largest_expense_deviation),
    )
    severity = _severity_from_impact(max_deviation, profit_deviation, len(affected_metrics))
    volatility = _series_volatility(df["revenue"]) if "revenue" in df.columns else 0.0

    return {
        "type": anomaly_type,
        "severity": severity,
        "confidence": _confidence_score(max_deviation, len(affected_metrics), volatility),
        "affected_metrics": affected_metrics or ["financial performance"],
        "time_period": _time_period(df, index),
        "explanation": explanation,
        "business_impact": _business_impact(anomaly_type, severity),
        "possible_causes": _possible_causes(anomaly_type, largest_expense_col),
        "recommended_action": _recommended_action(anomaly_type),
    }


def _severity_distribution(anomalies):
    distribution = {
        "LOW": 0,
        "MEDIUM": 0,
        "HIGH": 0,
        "CRITICAL": 0,
    }

    for anomaly in anomalies:
        distribution[anomaly["severity"]] += 1

    return distribution


def _agent_confidence(anomalies):
    if not anomalies:
        return 0.88

    return round(float(np.mean([anomaly["confidence"] for anomaly in anomalies])), 2)


def _summary(anomalies):
    if not anomalies:
        return "No material financial anomalies detected in the analyzed reporting periods."

    anomaly_label = "anomaly" if len(anomalies) == 1 else "anomalies"
    high_impact = [
        anomaly for anomaly in anomalies
        if anomaly["severity"] in ["HIGH", "CRITICAL"]
    ]
    type_list = sorted({anomaly["type"].lower() for anomaly in anomalies})
    type_text = ", ".join(type_list[:2])

    if high_impact:
        return f"{len(anomalies)} significant financial {anomaly_label} detected, including {type_text}."

    return f"{len(anomalies)} financial {anomaly_label} detected, with no critical severity indicators."


def _findings(anomalies):
    return [
        AgentFinding(
            title=anomaly["type"],
            description=f"{anomaly['time_period']}: {anomaly['explanation']}",
            severity=anomaly["severity"],
        )
        for anomaly in anomalies
    ]


def _warnings(anomalies):
    warnings = []

    if any(anomaly["type"] == "Revenue Collapse" for anomaly in anomalies):
        warnings.append(
            AgentWarning(
                message="Forecast reliability may be reduced by sudden revenue contraction.",
                impact="HIGH",
            )
        )

    if any(anomaly["type"] in ["Expense Surge", "Operational Cost Spike"] for anomaly in anomalies):
        warnings.append(
            AgentWarning(
                message="Expense volatility may pressure near-term profitability.",
                impact="MEDIUM",
            )
        )

    if any(anomaly["severity"] == "CRITICAL" for anomaly in anomalies):
        warnings.append(
            AgentWarning(
                message="Critical anomaly detected; executive review is recommended.",
                impact="HIGH",
            )
        )

    return warnings


def _reasoning(anomalies, detection_source):
    reasoning = [
        f"Anomaly candidates identified using {detection_source}.",
        "Anomalies interpreted through revenue, expense, and profitability deviation analysis.",
        "Severity derived from deviation magnitude, profitability impact, and affected metric count.",
        "Confidence scored from deviation strength, multi-metric agreement, and historical volatility.",
    ]

    if anomalies:
        reasoning.append("Business explanations and recommended actions generated deterministically from metric behavior.")

    return reasoning


# -------------------------------
# MAIN FUNCTION (WITH FALLBACK)
# -------------------------------
def detect_anomalies(df) -> AgentResponse:
    """
    Try ML model → fallback to rule-based detection.
    """

    anomaly_indices = detect_anomalies_ml(df)
    detection_source = "IsolationForest"

    if anomaly_indices is None:
        anomaly_indices = detect_anomalies_rule(df)
        detection_source = "rule-based revenue deviation checks"

    anomaly_indices = sorted(set(anomaly_indices))
    anomalies_detailed = [_classify_anomaly(df, index) for index in anomaly_indices]
    anomalies = [
        f"{anomaly['type']} in {anomaly['time_period']}: {anomaly['explanation']}"
        for anomaly in anomalies_detailed
    ]
    severity_distribution = _severity_distribution(anomalies_detailed)

    return AgentResponse(
        agent="anomaly_agent",
        confidence=_agent_confidence(anomalies_detailed),
        summary=_summary(anomalies_detailed),
        findings=_findings(anomalies_detailed),
        warnings=_warnings(anomalies_detailed),
        reasoning=_reasoning(anomalies_detailed, detection_source),
        metadata={
            "anomaly_count": len(anomalies_detailed),
            "detection_source": detection_source,
            "severity_distribution": severity_distribution,
        },
        raw_data={
            "anomalies": anomalies,
            "anomalies_detailed": anomalies_detailed,
            "severity_distribution": severity_distribution,
            "anomaly_count": len(anomalies_detailed),
        }
    )
