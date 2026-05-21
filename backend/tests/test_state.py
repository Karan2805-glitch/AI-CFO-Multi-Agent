from app.core.state import FinancialAnalysisState


def test_state_creation_uses_safe_defaults():
    first = FinancialAnalysisState(session_id="abc123")
    second = FinancialAnalysisState(session_id="xyz789")

    first.kpis["gross_margin"] = 0.42
    first.completed_agents.append("forecast_agent")

    assert second.kpis == {}
    assert second.completed_agents == []
    assert first.pipeline_status == "NOT_STARTED"


def test_execution_event_insertion():
    state = FinancialAnalysisState()

    state.add_execution_event(
        agent="forecast_agent",
        event="completed",
        details={"rows_processed": 12},
    )

    event = state.execution_trace[0]
    assert event["agent"] == "forecast_agent"
    assert event["event"] == "completed"
    assert event["details"] == {"rows_processed": 12}
    assert "timestamp" in event


def test_confidence_calculation():
    state = FinancialAnalysisState(
        forecast={"confidence": 0.8},
        risk={"confidence_score": 0.7},
        recommendations={"confidence": "0.9"},
        auditor={"confidence": 0.84},
    )

    confidence = state.calculate_overall_confidence()

    assert confidence == 0.81
    assert state.overall_confidence == 0.81
    assert state.execution_trace[-1]["event"] == "confidence_calculated"


def test_state_serialization_and_agent_output_lookup():
    state = FinancialAnalysisState(session_id="abc123", forecast={"confidence": 0.8})
    state.mark_agent_completed("forecast_agent")
    state.set_pipeline_status("RUNNING")

    payload = state.model_dump()

    assert payload["session_id"] == "abc123"
    assert payload["forecast"] == {"confidence": 0.8}
    assert payload["completed_agents"] == ["forecast_agent"]
    assert state.has_agent_output("forecast")
    assert state.has_agent_output("forecast_agent")
    assert not state.has_agent_output("risk_agent")
