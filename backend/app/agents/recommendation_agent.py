import numpy as np
import pandas as pd

from app.core.response_models import AgentResponse, AgentFinding, AgentWarning


PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def _priority_rank(priority):
    return PRIORITY_ORDER.index(priority) if priority in PRIORITY_ORDER else 0


def _max_priority(current, candidate):
    return candidate if _priority_rank(candidate) > _priority_rank(current) else current


def _risk_level(risk):
    return risk.get("risk_level") or risk.get("level") or "LOW"


def _risk_flags(risk):
    return risk.get("risk_flags") or risk.get("details", {}).get("risk_flags", [])


def _forecast_confidence(forecast):
    if not forecast:
        return None

    return forecast.get("confidence")


def _forecast_volatility(forecast):
    if not forecast:
        return None

    return forecast.get("volatility") or forecast.get("raw_data", {}).get("volatility")


def _forecast_trend(forecast):
    if not forecast:
        return None

    return forecast.get("trend") or forecast.get("raw_data", {}).get("trend")


def _anomaly_details(anomalies):
    if not anomalies:
        return []

    return anomalies.get("anomalies_detailed") or anomalies.get("raw_data", {}).get("anomalies_detailed", [])


def _highest_anomaly_severity(anomalies):
    details = _anomaly_details(anomalies)
    if not details:
        return None

    return max((item.get("severity", "LOW") for item in details), key=_priority_rank)


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


def _top_expense_ratio(expense_ratios):
    if not expense_ratios:
        return None, 0.0

    category, ratio = max(expense_ratios.items(), key=lambda item: item[1])
    label = category.replace("_ratio", "").replace("_", " ").title()
    return label, float(ratio)


def _add_recommendation(recommendations, item):
    existing = next((rec for rec in recommendations if rec["title"] == item["title"]), None)
    if existing:
        existing["priority"] = _max_priority(existing["priority"], item["priority"])
        return

    recommendations.append(item)


def _build_recommendation(
    title,
    recommendation,
    reasoning,
    priority,
    impact_area,
    time_horizon,
    expected_outcome,
):
    return {
        "title": title,
        "recommendation": recommendation,
        "reasoning": reasoning,
        "priority": priority,
        "impact_area": impact_area,
        "time_horizon": time_horizon,
        "expected_outcome": expected_outcome,
    }


def _apply_policy_escalation(recommendations, risk_level, anomaly_severity, forecast_confidence):
    for rec in recommendations:
        if risk_level == "CRITICAL":
            rec["priority"] = _max_priority(rec["priority"], "HIGH")
        elif risk_level == "HIGH" and rec["priority"] == "LOW":
            rec["priority"] = "MEDIUM"

        if anomaly_severity in ["HIGH", "CRITICAL"] and rec["impact_area"] in [
            "Cashflow Stability",
            "Operational Cost Control",
            "Profitability Stabilization",
        ]:
            rec["priority"] = _max_priority(rec["priority"], "HIGH")

        if forecast_confidence is not None and forecast_confidence < 0.55:
            rec["priority"] = _max_priority(rec["priority"], "HIGH")


def _priority_distribution(recommendations):
    distribution = {priority: 0 for priority in PRIORITY_ORDER}
    for rec in recommendations:
        distribution[rec["priority"]] += 1
    return distribution


def _dominant_focus_area(recommendations):
    if not recommendations:
        return "Financial Stability"

    counts = {}
    for rec in recommendations:
        counts[rec["impact_area"]] = counts.get(rec["impact_area"], 0) + 1

    return max(counts.items(), key=lambda item: item[1])[0]


def _agent_confidence(recommendations, forecast_confidence, anomalies):
    confidence = 0.82

    if forecast_confidence is not None and forecast_confidence < 0.55:
        confidence -= 0.08

    if _highest_anomaly_severity(anomalies) in ["HIGH", "CRITICAL"]:
        confidence += 0.04

    if not recommendations:
        confidence -= 0.05

    return round(float(min(max(confidence, 0.0), 1.0)), 2)


def _summary(recommendations):
    if not recommendations:
        return "No material strategic recommendations generated from the current financial profile."

    focus = _dominant_focus_area(recommendations).lower()
    high_priority = sum(1 for rec in recommendations if rec["priority"] in ["HIGH", "CRITICAL"])

    if high_priority:
        return f"Generated {len(recommendations)} strategic recommendations focused on {focus}, including {high_priority} high-priority actions."

    return f"Generated {len(recommendations)} strategic recommendations focused on {focus}."


def _findings(recommendations):
    return [
        AgentFinding(
            title=rec["title"],
            description=rec["reasoning"],
            severity=rec["priority"],
        )
        for rec in recommendations[:5]
    ]


def _warnings(risk_level, forecast_confidence, forecast_volatility, anomaly_severity):
    warnings = []

    if risk_level in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Elevated financial risk increases urgency of strategic actions.",
                impact=risk_level,
            )
        )

    if forecast_confidence is not None and forecast_confidence < 0.55:
        warnings.append(
            AgentWarning(
                message="Strategic planning confidence reduced by weak forecast confidence.",
                impact="HIGH",
            )
        )

    if forecast_volatility == "HIGH":
        warnings.append(
            AgentWarning(
                message="Strategic planning confidence reduced by elevated revenue volatility.",
                impact="HIGH",
            )
        )

    if anomaly_severity in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="High-severity anomaly signals require management review before aggressive expansion.",
                impact="HIGH",
            )
        )

    return warnings


def _reasoning(
    recommendations,
    risk_level,
    forecast_confidence,
    forecast_volatility,
    anomaly_severity,
):
    reasoning = [
        "Recommendations synthesized from KPIs, expense ratios, risk flags, forecast confidence, anomaly signals, and operating trend data.",
        "Recommendations prioritized according to risk level, anomaly severity, forecast uncertainty, and profitability pressure.",
        "Expense concentration analysis contributed to operational efficiency recommendations.",
        "Correlation signals are not used as standalone budget recommendation logic.",
    ]

    if risk_level in ["HIGH", "CRITICAL"]:
        reasoning.append("Elevated risk level increased recommendation urgency.")

    if forecast_confidence is not None and forecast_confidence < 0.55:
        reasoning.append("Weak forecast confidence shifted recommendations toward conservative planning.")

    if forecast_volatility in ["MEDIUM", "HIGH"]:
        reasoning.append("Revenue volatility contributed to cashflow and planning recommendations.")

    if anomaly_severity in ["HIGH", "CRITICAL"]:
        reasoning.append("High-severity anomaly intelligence escalated operational review priorities.")

    if recommendations:
        reasoning.append("Expected outcomes describe intended financial stabilization or control benefits.")

    return reasoning


def generate_recommendations(kpis, ratios, risk, df=None, forecast=None, anomalies=None) -> AgentResponse:
    recommendations = []

    profit_margin = float(kpis.get("profit_margin", 0))
    total_exp_ratio = float(ratios.get("total_expense_ratio", 0))
    expense_ratios = ratios.get("expense_ratios", {})
    risk_level = _risk_level(risk)
    risk_flags = _risk_flags(risk)
    forecast_confidence = _forecast_confidence(forecast)
    forecast_volatility = _forecast_volatility(forecast)
    forecast_trend = _forecast_trend(forecast)
    anomaly_details = _anomaly_details(anomalies)
    anomaly_types = {item.get("type") for item in anomaly_details}
    anomaly_severity = _highest_anomaly_severity(anomalies)
    revenue_volatility = _revenue_volatility(df)
    recent_revenue_change = _recent_revenue_change(df)
    expense_growth = _expense_growth(df)
    top_expense_label, top_expense_ratio = _top_expense_ratio(expense_ratios)

    if "Revenue Collapse" in anomaly_types or recent_revenue_change <= -0.25:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Cash Preservation Priority",
                recommendation="Preserve liquidity by delaying non-essential spend and reviewing near-term collections exposure.",
                reasoning=(
                    "Recent revenue contraction or revenue-collapse anomaly indicates cash inflow risk. "
                    "A conservative cash posture can protect operating flexibility while the revenue base stabilizes."
                ),
                priority="CRITICAL" if risk_level == "CRITICAL" else "HIGH",
                impact_area="Cashflow Stability",
                time_horizon="IMMEDIATE",
                expected_outcome="Reduced short-term cashflow pressure.",
            ),
        )

    if forecast_confidence is not None and forecast_confidence < 0.55:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Conservative Planning Assumption",
                recommendation="Base operating plans on the pessimistic forecast scenario until revenue predictability improves.",
                reasoning=(
                    f"Forecast confidence is {forecast_confidence:.2f}, below the preferred planning threshold. "
                    "Using conservative assumptions lowers the risk of overcommitting resources."
                ),
                priority="HIGH",
                impact_area="Planning Confidence",
                time_horizon="SHORT_TERM",
                expected_outcome="Lower forecast uncertainty and fewer budget surprises.",
            ),
        )

    if forecast_volatility == "HIGH" or revenue_volatility >= 0.25:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Revenue Volatility Controls",
                recommendation="Tighten rolling forecast reviews and set variance triggers for discretionary spending approvals.",
                reasoning=(
                    "Revenue volatility is elevated, making static budget assumptions less reliable. "
                    "Variance-triggered controls improve responsiveness without requiring broad cost freezes."
                ),
                priority="HIGH",
                impact_area="Cashflow Stability",
                time_horizon="SHORT_TERM",
                expected_outcome="Improved operating margin stability during volatile periods.",
            ),
        )

    if "Expense Surge" in anomaly_types or "Operational Cost Spike" in anomaly_types or expense_growth >= 0.25:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Operational Cost Audit",
                recommendation="Audit recent operating expense increases and separate recurring commitments from one-time spend.",
                reasoning=(
                    "Expense anomaly signals indicate spending expanded outside recent patterns. "
                    "Classifying recurring versus temporary cost growth helps prevent margin drift."
                ),
                priority="HIGH",
                impact_area="Operational Cost Control",
                time_horizon="IMMEDIATE",
                expected_outcome="Better discretionary spending control.",
            ),
        )

    if profit_margin < 0:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Profitability Recovery Plan",
                recommendation="Create a margin recovery plan that pairs revenue stabilization with targeted expense reductions.",
                reasoning=(
                    f"Profit margin is {profit_margin:.1f}%, indicating the business is operating at a loss. "
                    "A combined revenue and cost response is required because isolated cuts may not address demand weakness."
                ),
                priority="CRITICAL",
                impact_area="Profitability Stabilization",
                time_horizon="IMMEDIATE",
                expected_outcome="Improved operating margin stability.",
            ),
        )
    elif profit_margin < 10:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Margin Stabilization",
                recommendation="Prioritize actions that lift contribution margin before expanding discretionary budgets.",
                reasoning=(
                    f"Profit margin is {profit_margin:.1f}%, leaving limited buffer for volatility or cost overruns. "
                    "Improving margin resilience should precede growth-oriented spending."
                ),
                priority="HIGH",
                impact_area="Profitability Stabilization",
                time_horizon="SHORT_TERM",
                expected_outcome="Improved resilience against revenue or expense shocks.",
            ),
        )

    if total_exp_ratio > 80:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Expense Structure Review",
                recommendation="Review major cost categories and set near-term spend thresholds tied to revenue recovery.",
                reasoning=(
                    f"Total expenses represent {total_exp_ratio:.1f}% of revenue, limiting operating leverage. "
                    "Linking spend thresholds to revenue recovery can protect margins without indiscriminate cuts."
                ),
                priority="HIGH",
                impact_area="Operational Cost Control",
                time_horizon="SHORT_TERM",
                expected_outcome="Improved operating leverage and cost discipline.",
            ),
        )

    if top_expense_label and top_expense_ratio > 30:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title=f"{top_expense_label} Efficiency Review",
                recommendation=f"Assess {top_expense_label.lower()} efficiency against revenue contribution and near-term business priorities.",
                reasoning=(
                    f"{top_expense_label} represents {top_expense_ratio:.1f}% of revenue. "
                    "A concentrated cost base can amplify margin pressure when revenue momentum weakens."
                ),
                priority="MEDIUM" if profit_margin >= 10 else "HIGH",
                impact_area="Operational Cost Control",
                time_horizon="MEDIUM_TERM",
                expected_outcome="Better cost allocation and improved spending accountability.",
            ),
        )

    if forecast_trend == "DOWNWARD" and profit_margin < 15:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Revenue Stabilization Focus",
                recommendation="Prioritize retention, pricing discipline, and pipeline conversion before increasing fixed commitments.",
                reasoning=(
                    "The forecast trend is downward while profitability is not yet resilient. "
                    "Revenue stabilization reduces the chance that fixed costs outpace demand."
                ),
                priority="HIGH",
                impact_area="Revenue Stabilization",
                time_horizon="SHORT_TERM",
                expected_outcome="Reduced downside exposure from weak revenue momentum.",
            ),
        )

    if risk_level in ["HIGH", "CRITICAL"] or risk_flags:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Risk Governance Cadence",
                recommendation="Move financial risk review to a recurring management cadence until key risk flags normalize.",
                reasoning=(
                    f"Risk is classified as {risk_level}. "
                    "Recurring review keeps corrective actions visible and prevents risk indicators from becoming stale."
                ),
                priority="HIGH" if risk_level == "CRITICAL" else "MEDIUM",
                impact_area="Risk Governance",
                time_horizon="SHORT_TERM",
                expected_outcome="Faster management response to deteriorating financial signals.",
            ),
        )

    if not recommendations:
        _add_recommendation(
            recommendations,
            _build_recommendation(
                title="Controlled Growth Monitoring",
                recommendation="Maintain current operating strategy while monitoring expense concentration and forecast variance.",
                reasoning=(
                    "Profitability, risk, and volatility signals do not currently indicate material instability. "
                    "Continued monitoring preserves discipline while leaving room for growth opportunities."
                ),
                priority="LOW",
                impact_area="Financial Stability",
                time_horizon="LONG_TERM",
                expected_outcome="Sustained financial stability with early detection of emerging pressure.",
            ),
        )

    _apply_policy_escalation(recommendations, risk_level, anomaly_severity, forecast_confidence)

    priority_distribution = _priority_distribution(recommendations)
    recommendations_text = [rec["recommendation"] for rec in recommendations]
    dominant_focus_area = _dominant_focus_area(recommendations)

    return AgentResponse(
        agent="recommendation_agent",
        confidence=_agent_confidence(recommendations, forecast_confidence, anomalies),
        summary=_summary(recommendations),
        findings=_findings(recommendations),
        warnings=_warnings(risk_level, forecast_confidence, forecast_volatility, anomaly_severity),
        reasoning=_reasoning(
            recommendations,
            risk_level,
            forecast_confidence,
            forecast_volatility,
            anomaly_severity,
        ),
        metadata={
            "recommendation_count": len(recommendations),
            "high_priority_count": priority_distribution["HIGH"],
            "critical_priority_count": priority_distribution["CRITICAL"],
            "dominant_focus_area": dominant_focus_area,
        },
        raw_data={
            "recommendations": recommendations_text,
            "recommendations_detailed": recommendations,
            "recommendation_summary": _summary(recommendations),
            "priority_distribution": priority_distribution,
        },
    )
