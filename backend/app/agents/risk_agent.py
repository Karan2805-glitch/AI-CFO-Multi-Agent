import numpy as np
import pandas as pd

from app.core.response_models import AgentResponse, AgentFinding, AgentWarning


RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def max_risk(current, new):
    return RISK_LEVELS[max(RISK_LEVELS.index(current), RISK_LEVELS.index(new))]


def _risk_rank(level):
    return RISK_LEVELS.index(level) if level in RISK_LEVELS else 0


def _revenue_volatility(df):
    if df is None or "revenue" not in df.columns or len(df) < 3:
        return 0.0

    pct_changes = (
        pd.Series(df["revenue"])
        .pct_change()
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )

    return 0.0 if pct_changes.empty else float(pct_changes.std())


def _recent_revenue_change(df):
    if df is None or "revenue" not in df.columns or len(df) < 2:
        return 0.0

    previous = float(df["revenue"].iloc[-2])
    current = float(df["revenue"].iloc[-1])

    if previous == 0:
        return 0.0

    return (current - previous) / abs(previous)


def _expense_growth(df):
    if df is None or len(df) < 2:
        return 0.0

    expense_cols = [
        col for col in df.columns
        if col not in ["months", "date", "revenue"] and df[col].dtype.kind in "biufc"
    ]
    if not expense_cols:
        return 0.0

    expense_series = df[expense_cols].sum(axis=1)
    previous = float(expense_series.iloc[-2])
    current = float(expense_series.iloc[-1])

    if previous == 0:
        return 0.0

    return (current - previous) / abs(previous)


def _forecast_value(forecast_data, key, default=None):
    if not forecast_data:
        return default

    return forecast_data.get(key, forecast_data.get("raw_data", {}).get(key, default))


def _forecast_confidence(forecast_data):
    if not forecast_data:
        return None

    return forecast_data.get("confidence")


def _scenario_instability(forecast_data):
    scenarios = _forecast_value(forecast_data, "scenarios", {})
    expected = scenarios.get("expected", []) if isinstance(scenarios, dict) else []
    optimistic = scenarios.get("optimistic", []) if isinstance(scenarios, dict) else []
    pessimistic = scenarios.get("pessimistic", []) if isinstance(scenarios, dict) else []

    if not expected or not optimistic or not pessimistic:
        return 0.0

    expected_avg = np.mean([abs(float(v)) for v in expected]) or 1.0
    spread = np.mean([float(o) - float(p) for o, p in zip(optimistic, pessimistic)])
    return float(abs(spread) / expected_avg)


def _anomaly_details(anomaly_data):
    if not anomaly_data:
        return []

    return anomaly_data.get("anomalies_detailed") or anomaly_data.get("raw_data", {}).get("anomalies_detailed", [])


def _highest_anomaly_severity(anomaly_data):
    details = _anomaly_details(anomaly_data)
    if not details:
        return None

    return max((item.get("severity", "LOW") for item in details), key=_risk_rank)


def _anomaly_types(anomaly_data):
    return {item.get("type") for item in _anomaly_details(anomaly_data)}


def _top_expense_ratio(expense_ratios):
    if not expense_ratios:
        return None, 0.0

    category, ratio = max(expense_ratios.items(), key=lambda item: item[1])
    return category.replace("_ratio", "").replace("_", " ").title(), float(ratio)


def _profitability_risk(profit_margin, expense_ratios, anomaly_types, signals):
    risk = "LOW"

    if profit_margin < 0:
        risk = "CRITICAL"
        signals.append("Company is running at a loss")
    elif profit_margin < 10:
        risk = "HIGH"
        signals.append("Low profit margin")
    elif profit_margin < 20:
        risk = "MEDIUM"
        signals.append("Moderate profit margin")

    top_expense_label, top_expense_ratio = _top_expense_ratio(expense_ratios)
    if top_expense_ratio > 40 and profit_margin < 15:
        risk = max_risk(risk, "HIGH")
        signals.append(f"High {top_expense_label.lower()} concentration with weak margin buffer")

    if "Profitability Deterioration" in anomaly_types:
        risk = max_risk(risk, "HIGH")
        signals.append("Profitability deterioration anomaly detected")

    return risk


def _operational_risk(total_exp_ratio, expense_ratios, expense_growth, anomaly_types, signals):
    risk = "LOW"

    if total_exp_ratio > 100:
        risk = "CRITICAL"
        signals.append("Expenses exceed revenue")
    elif total_exp_ratio > 80:
        risk = "HIGH"
        signals.append("Expenses are too high compared to revenue")
    elif total_exp_ratio > 65:
        risk = "MEDIUM"
        signals.append("Expense load is elevated compared to revenue")

    if expense_ratios.get("marketing_ratio", 0) > 25:
        risk = max_risk(risk, "MEDIUM")
        signals.append("High marketing spend")

    if expense_ratios.get("rent_ratio", 0) > 30:
        risk = max_risk(risk, "MEDIUM")
        signals.append("High fixed cost exposure")

    if expense_ratios.get("salaries_ratio", 0) > 40:
        risk = max_risk(risk, "HIGH")
        signals.append("High salary expenses")

    if expense_growth >= 0.25:
        risk = max_risk(risk, "HIGH")
        signals.append("Recent expense growth is elevated")

    if "Expense Surge" in anomaly_types or "Operational Cost Spike" in anomaly_types:
        risk = max_risk(risk, "HIGH")
        signals.append("Expense anomaly detected")

    return risk


def _volatility_risk(revenue_volatility, forecast_volatility, signals):
    risk = "LOW"

    if revenue_volatility > 0.35 or forecast_volatility == "HIGH":
        risk = "HIGH"
        signals.append("High revenue volatility")
    elif revenue_volatility > 0.2 or forecast_volatility == "MEDIUM":
        risk = "MEDIUM"
        signals.append("Moderate revenue volatility")

    return risk


def _forecast_risk(forecast_confidence, forecast_trend, scenario_instability, signals):
    risk = "LOW"

    if forecast_confidence is not None and forecast_confidence < 0.55:
        risk = "HIGH"
        signals.append("Weak forecast confidence")
    elif forecast_confidence is not None and forecast_confidence < 0.75:
        risk = "MEDIUM"
        signals.append("Moderate forecast confidence")

    if forecast_trend == "DOWNWARD":
        risk = max_risk(risk, "MEDIUM")
        signals.append("Forecast trend is downward")

    if scenario_instability > 0.25:
        risk = max_risk(risk, "MEDIUM")
        signals.append("Scenario spread indicates forecast sensitivity")

    return risk


def _cashflow_risk(profit_margin, recent_revenue_change, anomaly_types, expense_growth, signals):
    risk = "LOW"

    if "Revenue Collapse" in anomaly_types:
        risk = "CRITICAL"
        signals.append("Revenue collapse anomaly detected")
    elif recent_revenue_change <= -0.3:
        risk = "HIGH"
        signals.append("Recent revenue dropped sharply")
    elif recent_revenue_change <= -0.15:
        risk = "MEDIUM"
        signals.append("Recent revenue softened")

    if profit_margin < 0:
        risk = max_risk(risk, "HIGH")
        signals.append("Loss position increases cashflow pressure")

    if expense_growth >= 0.25 and recent_revenue_change < 0:
        risk = max_risk(risk, "HIGH")
        signals.append("Expenses increased while revenue weakened")

    return risk


def _growth_stability_risk(forecast_trend, revenue_volatility, recent_revenue_change, anomaly_types, signals):
    risk = "LOW"

    if forecast_trend == "DOWNWARD" and revenue_volatility > 0.25:
        risk = "HIGH"
        signals.append("Downward trend combined with high volatility")
    elif forecast_trend == "DOWNWARD" or revenue_volatility > 0.2:
        risk = "MEDIUM"
        signals.append("Growth stability is under pressure")

    if "Revenue Spike" in anomaly_types:
        risk = max_risk(risk, "MEDIUM")
        signals.append("Revenue spike may distort growth run-rate")

    if recent_revenue_change <= -0.2:
        risk = max_risk(risk, "HIGH")
        signals.append("Recent revenue contraction weakens growth stability")

    return risk


def _overall_risk(risk_dimensions, anomaly_severity, forecast_confidence):
    overall = "LOW"
    for level in risk_dimensions.values():
        overall = max_risk(overall, level)

    high_count = sum(1 for level in risk_dimensions.values() if level == "HIGH")
    critical_count = sum(1 for level in risk_dimensions.values() if level == "CRITICAL")

    if critical_count and forecast_confidence is not None and forecast_confidence < 0.55:
        overall = "CRITICAL"
    elif anomaly_severity == "CRITICAL" and forecast_confidence is not None and forecast_confidence < 0.65:
        overall = "CRITICAL"
    elif high_count >= 3 and overall != "CRITICAL":
        overall = "CRITICAL"
    elif high_count >= 2 and overall == "MEDIUM":
        overall = "HIGH"

    return overall


def _dominant_risk_factor(risk_dimensions):
    return max(risk_dimensions.items(), key=lambda item: _risk_rank(item[1]))[0]


def _severity_breakdown(risk_dimensions):
    return {
        level: sum(1 for dimension_level in risk_dimensions.values() if dimension_level == level)
        for level in RISK_LEVELS
    }


def _risk_confidence(supporting_signals, anomaly_severity, forecast_confidence, risk_dimensions):
    confidence = 0.62
    confidence += min(len(supporting_signals) * 0.035, 0.21)

    if anomaly_severity in ["HIGH", "CRITICAL"]:
        confidence += 0.08

    if forecast_confidence is not None:
        if forecast_confidence < 0.55:
            confidence += 0.04
        elif forecast_confidence > 0.8:
            confidence += 0.03

    high_or_critical = sum(1 for level in risk_dimensions.values() if level in ["HIGH", "CRITICAL"])
    if high_or_critical >= 3:
        confidence += 0.07

    return round(float(min(max(confidence, 0.0), 1.0)), 2)


def _summary(risk_level, risk_dimensions, forecast_trend, forecast_volatility, anomaly_types, profit_margin):
    dominant = _dominant_risk_factor(risk_dimensions).replace("_", " ")

    if risk_level in ["HIGH", "CRITICAL"]:
        drivers = []
        if forecast_trend == "DOWNWARD":
            drivers.append("weakening revenue momentum")
        if forecast_volatility == "HIGH":
            drivers.append("increased volatility")
        if profit_margin < 10:
            drivers.append("profitability pressure")
        if "Revenue Collapse" in anomaly_types:
            drivers.append("revenue collapse signals")
        if not drivers:
            drivers.append(dominant)

        return f"Financial risk is {risk_level.lower()} due to {', '.join(drivers[:3])}."

    if risk_level == "MEDIUM":
        return "Risk profile remains manageable but requires monitoring due to moderate forecast or operating pressure."

    return "Risk profile appears manageable with no material financial instability indicators."


def _findings(risk_dimensions):
    titles = {
        "profitability_risk": "Profitability Pressure",
        "volatility_risk": "Revenue Volatility Risk",
        "cashflow_risk": "Cashflow Risk",
        "operational_risk": "Operational Cost Risk",
        "forecast_risk": "Forecast Reliability Risk",
        "growth_stability_risk": "Growth Stability Risk",
    }
    descriptions = {
        "profitability_risk": "Operating margin remains vulnerable to revenue or expense pressure.",
        "volatility_risk": "Elevated revenue volatility reduces planning reliability.",
        "cashflow_risk": "Cashflow stability is exposed to revenue contraction or loss pressure.",
        "operational_risk": "Operational expense pressure may reduce financial flexibility.",
        "forecast_risk": "Forecast uncertainty may reduce planning confidence.",
        "growth_stability_risk": "Revenue growth stability is vulnerable to trend and volatility shifts.",
    }

    return [
        AgentFinding(
            title=titles[dimension],
            description=descriptions[dimension],
            severity=level,
        )
        for dimension, level in risk_dimensions.items()
        if level != "LOW"
    ]


def _warnings(risk_dimensions, anomaly_severity, forecast_confidence, forecast_volatility):
    warnings = []

    if risk_dimensions.get("forecast_risk") in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Weak forecast confidence may reduce operational planning reliability.",
                impact="HIGH",
            )
        )

    if forecast_volatility == "HIGH" or risk_dimensions.get("volatility_risk") == "HIGH":
        warnings.append(
            AgentWarning(
                message="High forecast volatility may reduce operational planning reliability.",
                impact="HIGH",
            )
        )

    if anomaly_severity in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Critical or high-severity anomaly signals increase short-term execution risk.",
                impact="HIGH",
            )
        )

    if risk_dimensions.get("operational_risk") in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Operational cost pressure may require near-term spending controls.",
                impact="MEDIUM",
            )
        )

    if forecast_confidence is not None and forecast_confidence < 0.55:
        warnings.append(
            AgentWarning(
                message="Weak forecast confidence increases uncertainty-related risk.",
                impact="HIGH",
            )
        )

    return warnings


def _reasoning(risk_dimensions, supporting_signals, anomaly_types, forecast_confidence, forecast_trend):
    reasoning = [
        "Risk assessment synthesized profitability, expense pressure, volatility, anomaly severity, and forecast stability.",
        "Foundational KPI and ratio thresholds were preserved as baseline risk signals.",
        "Dimensional risk levels were escalated when multiple financial signals reinforced the same concern.",
    ]

    if "Revenue Collapse" in anomaly_types:
        reasoning.append("Revenue collapse anomalies contributed to elevated cashflow risk.")

    if "Expense Surge" in anomaly_types or "Operational Cost Spike" in anomaly_types:
        reasoning.append("Expense anomalies contributed to elevated operational risk.")

    if forecast_confidence is not None and forecast_confidence < 0.55:
        reasoning.append("Weak forecast confidence increased uncertainty-related risk.")

    if forecast_trend == "DOWNWARD":
        reasoning.append("Downward forecast trend contributed to growth stability risk.")

    high_dimensions = [
        dimension for dimension, level in risk_dimensions.items()
        if level in ["HIGH", "CRITICAL"]
    ]
    if high_dimensions:
        reasoning.append(f"High-risk dimensions identified: {', '.join(high_dimensions)}.")

    if supporting_signals:
        reasoning.append(f"{len(supporting_signals)} supporting indicators contributed to the classification.")

    return reasoning


def assess_risk(kpis, ratios, df=None, forecast_data=None, anomaly_data=None) -> AgentResponse:
    supporting_signals = []

    profit_margin = float(kpis.get("profit_margin", 0))
    total_exp_ratio = float(ratios.get("total_expense_ratio", 0))
    expense_ratios = ratios.get("expense_ratios", {})
    revenue_volatility = _revenue_volatility(df)
    recent_revenue_change = _recent_revenue_change(df)
    expense_growth = _expense_growth(df)
    forecast_confidence = _forecast_confidence(forecast_data)
    forecast_trend = _forecast_value(forecast_data, "trend")
    forecast_volatility = _forecast_value(forecast_data, "volatility")
    scenario_instability = _scenario_instability(forecast_data)
    anomaly_types = _anomaly_types(anomaly_data)
    anomaly_severity = _highest_anomaly_severity(anomaly_data)

    risk_dimensions = {
        "profitability_risk": _profitability_risk(
            profit_margin,
            expense_ratios,
            anomaly_types,
            supporting_signals,
        ),
        "volatility_risk": _volatility_risk(
            revenue_volatility,
            forecast_volatility,
            supporting_signals,
        ),
        "cashflow_risk": _cashflow_risk(
            profit_margin,
            recent_revenue_change,
            anomaly_types,
            expense_growth,
            supporting_signals,
        ),
        "operational_risk": _operational_risk(
            total_exp_ratio,
            expense_ratios,
            expense_growth,
            anomaly_types,
            supporting_signals,
        ),
        "forecast_risk": _forecast_risk(
            forecast_confidence,
            forecast_trend,
            scenario_instability,
            supporting_signals,
        ),
        "growth_stability_risk": _growth_stability_risk(
            forecast_trend,
            revenue_volatility,
            recent_revenue_change,
            anomaly_types,
            supporting_signals,
        ),
    }
    risk_level = _overall_risk(risk_dimensions, anomaly_severity, forecast_confidence)
    risk_flags = sorted(set(supporting_signals))
    severity_breakdown = _severity_breakdown(risk_dimensions)
    dominant_risk_factor = _dominant_risk_factor(risk_dimensions)
    high_risk_dimensions = sum(1 for level in risk_dimensions.values() if level == "HIGH")
    critical_risk_dimensions = sum(1 for level in risk_dimensions.values() if level == "CRITICAL")

    return AgentResponse(
        agent="risk_agent",
        confidence=_risk_confidence(
            risk_flags,
            anomaly_severity,
            forecast_confidence,
            risk_dimensions,
        ),
        summary=_summary(
            risk_level,
            risk_dimensions,
            forecast_trend,
            forecast_volatility,
            anomaly_types,
            profit_margin,
        ),
        findings=_findings(risk_dimensions),
        warnings=_warnings(
            risk_dimensions,
            anomaly_severity,
            forecast_confidence,
            forecast_volatility,
        ),
        reasoning=_reasoning(
            risk_dimensions,
            risk_flags,
            anomaly_types,
            forecast_confidence,
            forecast_trend,
        ),
        metadata={
            "risk_dimensions": risk_dimensions,
            "high_risk_dimensions": high_risk_dimensions,
            "critical_risk_dimensions": critical_risk_dimensions,
            "dominant_risk_factor": dominant_risk_factor,
            "supporting_signal_count": len(risk_flags),
        },
        raw_data={
            "risk_level": risk_level,
            "risk_flags": risk_flags,
            "risk_dimensions": risk_dimensions,
            "dominant_risk_factor": dominant_risk_factor,
            "severity_breakdown": severity_breakdown,
            "supporting_signals": risk_flags,
        },
    )
