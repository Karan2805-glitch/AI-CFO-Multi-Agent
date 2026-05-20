import json
import os

from app.core.response_models import AgentResponse, AgentFinding, AgentWarning


SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def _rank(level):
    return SEVERITY_ORDER.index(level) if level in SEVERITY_ORDER else 0


def _risk_level(risk_data):
    return risk_data.get("risk_level", "UNKNOWN")


def _forecast_value(forecast_data, key, default=None):
    if not forecast_data:
        return default

    return forecast_data.get(key, forecast_data.get("raw_data", {}).get(key, default))


def _forecast_growth_value(forecast_data):
    growth = _forecast_value(forecast_data, "growth_rate", {})
    if isinstance(growth, dict):
        return float(growth.get("value", 0))

    if isinstance(growth, str):
        try:
            return float(growth.replace("%", ""))
        except ValueError:
            return 0.0

    return 0.0


def _forecast_confidence(forecast_data):
    return forecast_data.get("confidence") if forecast_data else None


def _anomaly_details(anomaly_data):
    if not anomaly_data:
        return []

    return anomaly_data.get("anomalies_detailed") or anomaly_data.get("raw_data", {}).get("anomalies_detailed", [])


def _highest_anomaly_severity(anomaly_data):
    details = _anomaly_details(anomaly_data)
    if not details:
        return None

    return max((item.get("severity", "LOW") for item in details), key=_rank)


def _recommendation_details(recommendation_data, recommendations=None):
    if recommendation_data:
        detailed = recommendation_data.get("recommendations_detailed") or recommendation_data.get("raw_data", {}).get("recommendations_detailed")
        if detailed:
            return detailed

    return [
        {
            "title": f"Strategic Action {index + 1}",
            "recommendation": recommendation,
            "priority": "MEDIUM",
            "impact_area": "Financial Stability",
            "reasoning": recommendation,
            "expected_outcome": "Improved financial discipline.",
        }
        for index, recommendation in enumerate(recommendations or [])
    ]


def _health_score_value(health_score):
    if not health_score:
        return None

    value = health_score.get("health_score")
    if value is None and isinstance(health_score.get("raw_data"), dict):
        value = health_score["raw_data"].get("health_score")

    return value


def _dominant_risks(risk_data):
    dimensions = risk_data.get("risk_dimensions") or risk_data.get("raw_data", {}).get("risk_dimensions", {})
    dominant = [
        {
            "dimension": dimension,
            "severity": severity,
        }
        for dimension, severity in dimensions.items()
        if severity in ["HIGH", "CRITICAL"]
    ]

    return sorted(dominant, key=lambda item: _rank(item["severity"]), reverse=True)


def _conflicting_signals(kpis, forecast_data, risk_data, anomaly_data):
    conflicts = []
    profit_margin = float(kpis.get("profit_margin", 0))
    forecast_trend = _forecast_value(forecast_data, "trend")
    forecast_confidence = _forecast_confidence(forecast_data)
    risk_level = _risk_level(risk_data)
    anomaly_severity = _highest_anomaly_severity(anomaly_data)

    if forecast_trend == "UPWARD" and risk_level in ["HIGH", "CRITICAL"]:
        conflicts.append(
            "Although projected revenue momentum remains positive, elevated operational or cashflow risk continues to introduce execution risk."
        )

    if profit_margin >= 20 and forecast_confidence is not None and forecast_confidence < 0.55:
        conflicts.append(
            "Profitability appears healthy, but weak forecast confidence limits planning certainty."
        )

    if risk_level in ["LOW", "MEDIUM"] and anomaly_severity in ["HIGH", "CRITICAL"]:
        conflicts.append(
            "Baseline risk appears manageable, but recent high-severity anomaly activity requires caution."
        )

    if forecast_trend == "DOWNWARD" and profit_margin >= 20:
        conflicts.append(
            "Current profitability remains strong, but projected revenue direction suggests margin resilience may be tested."
        )

    return conflicts


def _uncertainty_level(forecast_data, anomaly_data, risk_data):
    score = 0
    forecast_confidence = _forecast_confidence(forecast_data)
    forecast_volatility = _forecast_value(forecast_data, "volatility")
    anomaly_severity = _highest_anomaly_severity(anomaly_data)
    risk_level = _risk_level(risk_data)

    if forecast_confidence is not None and forecast_confidence < 0.55:
        score += 2
    elif forecast_confidence is not None and forecast_confidence < 0.75:
        score += 1

    if forecast_volatility == "HIGH":
        score += 2
    elif forecast_volatility == "MEDIUM":
        score += 1

    if anomaly_severity == "CRITICAL":
        score += 2
    elif anomaly_severity == "HIGH":
        score += 1

    if risk_level in ["HIGH", "CRITICAL"]:
        score += 1

    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    return "LOW"


def _uncertainty_summary(uncertainty_level, forecast_data, anomaly_data):
    forecast_confidence = _forecast_confidence(forecast_data)
    forecast_volatility = _forecast_value(forecast_data, "volatility")
    anomaly_severity = _highest_anomaly_severity(anomaly_data)

    drivers = []
    if forecast_confidence is not None and forecast_confidence < 0.75:
        drivers.append(f"forecast confidence of {forecast_confidence:.2f}")
    if forecast_volatility in ["MEDIUM", "HIGH"]:
        drivers.append(f"{forecast_volatility.lower()} revenue volatility")
    if anomaly_severity in ["HIGH", "CRITICAL"]:
        drivers.append(f"{anomaly_severity.lower()} anomaly activity")

    if not drivers:
        return "Planning uncertainty is low because forecast, risk, and anomaly signals are broadly stable."

    return f"Planning uncertainty is {uncertainty_level.lower()} due to {', '.join(drivers)}."


def _executive_priorities(risk_data, recommendation_data, recommendations):
    detailed_recommendations = _recommendation_details(recommendation_data, recommendations)
    priorities = []

    for rec in sorted(detailed_recommendations, key=lambda item: _rank(item.get("priority", "LOW")), reverse=True)[:4]:
        priorities.append(
            {
                "title": rec.get("impact_area") or rec.get("title", "Strategic Priority"),
                "priority": rec.get("priority", "MEDIUM"),
                "reason": rec.get("reasoning", rec.get("recommendation", "")),
                "recommended_focus": rec.get("recommendation", ""),
            }
        )

    if not priorities:
        dominant = risk_data.get("dominant_risk_factor", "financial_stability").replace("_", " ").title()
        priorities.append(
            {
                "title": dominant,
                "priority": "MEDIUM",
                "reason": "Risk intelligence identified this as the primary area requiring management attention.",
                "recommended_focus": "Monitor this area through the next reporting cycle.",
            }
        )

    return priorities


def _strategic_outlook(kpis, forecast_data, risk_data, anomaly_data, health_score):
    profit_margin = float(kpis.get("profit_margin", 0))
    forecast_trend = _forecast_value(forecast_data, "trend")
    forecast_volatility = _forecast_value(forecast_data, "volatility")
    risk_level = _risk_level(risk_data)
    anomaly_severity = _highest_anomaly_severity(anomaly_data)
    health_value = _health_score_value(health_score)

    if risk_level in ["HIGH", "CRITICAL"] or anomaly_severity in ["HIGH", "CRITICAL"]:
        short_term = "Short-term operational stability remains vulnerable due to elevated risk and recent anomaly pressure."
    elif forecast_volatility in ["MEDIUM", "HIGH"]:
        short_term = "Short-term planning should remain conservative while revenue volatility normalizes."
    else:
        short_term = "Short-term financial posture appears manageable with no severe instability signals."

    if forecast_trend == "UPWARD" and profit_margin >= 10:
        medium_term = "Medium-term outlook can improve if revenue momentum converts into stable margin expansion."
    elif forecast_trend == "DOWNWARD":
        medium_term = "Medium-term outlook depends on revenue stabilization and tighter operating discipline."
    else:
        medium_term = "Medium-term outlook remains balanced, with execution discipline determining margin durability."

    if health_value is not None and health_value >= 70 and risk_level in ["LOW", "MEDIUM"]:
        long_term = "Long-term posture appears constructive if current financial controls are maintained."
    elif profit_margin < 10 or risk_level in ["HIGH", "CRITICAL"]:
        long_term = "Long-term resilience requires sustained improvement in revenue consistency and cost structure."
    else:
        long_term = "Long-term performance potential remains intact, but should be governed by forecast and risk monitoring."

    return {
        "short_term": short_term,
        "medium_term": medium_term,
        "long_term": long_term,
    }


def _executive_summary(kpis, ratios, forecast_data, anomaly_data, risk_data, health_score, uncertainty_level):
    profit_margin = float(kpis.get("profit_margin", 0))
    total_exp_ratio = float(ratios.get("total_expense_ratio", 0))
    risk_level = _risk_level(risk_data)
    forecast_trend = _forecast_value(forecast_data, "trend", "STABLE")
    forecast_volatility = _forecast_value(forecast_data, "volatility", "LOW")
    anomaly_count = anomaly_data.get("anomaly_count", 0) if anomaly_data else 0
    health_value = _health_score_value(health_score)

    posture = "resilient" if profit_margin >= 20 and risk_level in ["LOW", "MEDIUM"] else "pressured"
    if risk_level == "CRITICAL":
        posture = "materially pressured"
    elif risk_level == "HIGH":
        posture = "operationally pressured"

    health_phrase = f" Health score is {health_value}/100." if health_value is not None else ""

    return (
        f"Financial posture is {posture}: profit margin is {profit_margin:.1f}% while expenses represent "
        f"{total_exp_ratio:.1f}% of revenue. Risk is classified as {risk_level}, with a {forecast_trend.lower()} "
        f"forecast trend, {forecast_volatility.lower()} volatility, and {anomaly_count} detected anomaly signal(s). "
        f"Planning uncertainty is {uncertainty_level.lower()}.{health_phrase}"
    )


def _findings(forecast_data, anomaly_data, risk_data, uncertainty_level, conflicts):
    findings = []
    dominant_risks = _dominant_risks(risk_data)
    forecast_confidence = _forecast_confidence(forecast_data)
    forecast_volatility = _forecast_value(forecast_data, "volatility")

    for risk in dominant_risks[:3]:
        findings.append(
            AgentFinding(
                title=risk["dimension"].replace("_", " ").title(),
                description=f"{risk['dimension'].replace('_', ' ')} is classified as {risk['severity']}.",
                severity=risk["severity"],
            )
        )

    if forecast_confidence is not None and forecast_confidence < 0.75:
        findings.append(
            AgentFinding(
                title="Forecast Uncertainty",
                description="Forecast reliability is reduced by confidence and volatility signals.",
                severity="HIGH" if forecast_confidence < 0.55 else "MEDIUM",
            )
        )

    if forecast_volatility == "HIGH":
        findings.append(
            AgentFinding(
                title="Operational Instability",
                description="Revenue volatility and forecast sensitivity continue to elevate operational execution risk.",
                severity="HIGH",
            )
        )

    if conflicts:
        findings.append(
            AgentFinding(
                title="Conflicting Signals",
                description=conflicts[0],
                severity="MEDIUM" if uncertainty_level != "HIGH" else "HIGH",
            )
        )

    if not findings:
        findings.append(
            AgentFinding(
                title="Financial Posture",
                description="Financial posture appears stable with no dominant high-severity synthesis concern.",
                severity="INFO",
            )
        )

    return findings


def _warnings(forecast_data, anomaly_data, risk_data, uncertainty_level):
    warnings = []
    forecast_volatility = _forecast_value(forecast_data, "volatility")
    anomaly_severity = _highest_anomaly_severity(anomaly_data)
    risk_level = _risk_level(risk_data)
    forecast_growth = _forecast_growth_value(forecast_data)

    if forecast_volatility == "HIGH":
        warnings.append(
            AgentWarning(
                message="High volatility may reduce near-term planning reliability.",
                impact="HIGH",
            )
        )

    if anomaly_severity in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Recent anomaly activity may pressure operational execution and planning confidence.",
                impact="HIGH",
            )
        )

    if risk_level in ["HIGH", "CRITICAL"]:
        warnings.append(
            AgentWarning(
                message="Elevated risk profile requires executive prioritization of mitigation actions.",
                impact=risk_level,
            )
        )

    if forecast_growth < -10:
        warnings.append(
            AgentWarning(
                message="Revenue contraction signals may pressure short-term liquidity.",
                impact="HIGH",
            )
        )

    if uncertainty_level == "HIGH":
        warnings.append(
            AgentWarning(
                message="Planning uncertainty is elevated; aggressive commitments should be stress-tested.",
                impact="HIGH",
            )
        )

    return warnings


def _reasoning(conflicts, uncertainty_level, executive_priorities):
    reasoning = [
        "Executive synthesis incorporated anomaly severity, forecast stability, risk dimensions, recommendation priorities, profitability posture, and health score.",
        "Recommendations were prioritized according to forecast uncertainty, operational pressure, and dominant risk factors.",
        "Strategic outlook was generated from trend direction, volatility, anomaly pressure, risk level, and profitability resilience.",
        f"Uncertainty was classified as {uncertainty_level} based on forecast confidence, volatility, anomaly severity, and risk level.",
    ]

    if conflicts:
        reasoning.append("Conflicting forecast and operational signals were balanced through contextual risk weighting.")

    if executive_priorities:
        reasoning.append(f"{len(executive_priorities)} executive priorities were selected from high-impact recommendation and risk signals.")

    return reasoning


def _auditor_confidence(forecast_data, anomaly_data, risk_data, conflicts, uncertainty_level):
    confidence = 0.78
    forecast_confidence = _forecast_confidence(forecast_data)
    anomaly_severity = _highest_anomaly_severity(anomaly_data)
    risk_level = _risk_level(risk_data)

    if forecast_confidence is not None:
        confidence = (confidence + forecast_confidence) / 2

    if anomaly_severity in ["HIGH", "CRITICAL"] and risk_level in ["HIGH", "CRITICAL"]:
        confidence += 0.08

    if conflicts:
        confidence -= 0.05

    if uncertainty_level == "HIGH":
        confidence -= 0.08
    elif uncertainty_level == "LOW":
        confidence += 0.04

    return round(float(min(max(confidence, 0.0), 1.0)), 2)


def _gemini_summary(payload, fallback_summary):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback_summary

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are an expert AI Chief Financial Officer.
        Convert this structured financial intelligence synthesis into a concise boardroom executive briefing.
        Preserve the factual meaning and do not introduce new facts.
        Do not use markdown or asterisks.

        Structured synthesis:
        {json.dumps(payload)}
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        return text or fallback_summary
    except Exception as e:
        print(f"GenAI Auditor Failed: {e}. Falling back to structured synthesis.")
        return fallback_summary


def generate_explanation(
    kpis,
    ratios,
    forecast_data=None,
    anomaly_data=None,
    risk_data=None,
    recommendation_data=None,
    health_score=None,
    recommendations=None,
) -> AgentResponse:
    risk_data = risk_data or {}
    recommendation_data = recommendation_data or {}
    recommendations = recommendations or recommendation_data.get("recommendations", [])

    conflicts = _conflicting_signals(kpis, forecast_data, risk_data, anomaly_data)
    uncertainty_level = _uncertainty_level(forecast_data, anomaly_data, risk_data)
    uncertainty_summary = _uncertainty_summary(uncertainty_level, forecast_data, anomaly_data)
    executive_priorities = _executive_priorities(risk_data, recommendation_data, recommendations)
    strategic_outlook = _strategic_outlook(kpis, forecast_data, risk_data, anomaly_data, health_score)
    dominant_risks = _dominant_risks(risk_data)
    summary = _executive_summary(kpis, ratios, forecast_data, anomaly_data, risk_data, health_score, uncertainty_level)

    payload = {
        "summary": summary,
        "uncertainty_summary": uncertainty_summary,
        "executive_priorities": executive_priorities,
        "strategic_outlook": strategic_outlook,
        "dominant_risks": dominant_risks,
        "conflicting_signals": conflicts,
    }
    synthesized_summary = _gemini_summary(payload, summary)
    primary_focus_area = executive_priorities[0]["title"] if executive_priorities else "Financial Stability"

    return AgentResponse(
        agent="auditor_agent",
        confidence=_auditor_confidence(forecast_data, anomaly_data, risk_data, conflicts, uncertainty_level),
        summary=synthesized_summary,
        findings=_findings(forecast_data, anomaly_data, risk_data, uncertainty_level, conflicts),
        warnings=_warnings(forecast_data, anomaly_data, risk_data, uncertainty_level),
        reasoning=_reasoning(conflicts, uncertainty_level, executive_priorities),
        metadata={
            "dominant_risk_factor": risk_data.get("dominant_risk_factor"),
            "primary_focus_area": primary_focus_area,
            "high_priority_count": sum(1 for item in executive_priorities if item["priority"] == "HIGH"),
            "conflicting_signal_detected": bool(conflicts),
            "uncertainty_level": uncertainty_level,
        },
        raw_data={
            "summary": synthesized_summary,
            "details": [synthesized_summary],
            "executive_priorities": executive_priorities,
            "strategic_outlook": strategic_outlook,
            "uncertainty_summary": uncertainty_summary,
            "dominant_risks": dominant_risks,
            "conflicting_signals": conflicts,
        },
    )
