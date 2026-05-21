import pandas as pd
import asyncio

from app.core.state import FinancialAnalysisState
from app.orchestration.orchestrator import FinancialOrchestrator
from app.services.analysis_service import analyze
from app.services.kpi_service import calculate_kpis
from app.services.preprocessing import preprocess
from app.services.ratio_service import calculate_ratios


def _sample_df():
    return pd.DataFrame(
        {
            "months": pd.date_range("2025-01-01", periods=6, freq="MS"),
            "revenue": [10000, 12000, 11500, 13000, 12800, 14000],
            "salaries": [3000, 3200, 3100, 3300, 3350, 3400],
            "marketing": [800, 900, 850, 950, 900, 1000],
            "rent": [1200, 1200, 1200, 1200, 1200, 1200],
        }
    )


def _state_from_df(df):
    processed = preprocess(df)
    kpis = calculate_kpis(processed)
    ratios = calculate_ratios(kpis)
    serializable = processed.copy()
    datetime_columns = []

    for column in serializable.columns:
        if pd.api.types.is_datetime64_any_dtype(serializable[column]):
            datetime_columns.append(column)
            serializable[column] = serializable[column].dt.strftime("%Y-%m-%dT%H:%M:%S")

    return FinancialAnalysisState(
        preprocessing={
            "dataframe_records": serializable.to_dict(orient="records"),
            "dataframe_columns": list(serializable.columns),
            "datetime_columns": datetime_columns,
        },
        kpis=kpis,
        ratios=ratios,
    )


def test_orchestrator_execution_updates_state():
    state = _state_from_df(_sample_df())

    final_state = asyncio.run(FinancialOrchestrator().run_pipeline(state))

    assert final_state.pipeline_status == "COMPLETED"
    assert final_state.forecast
    assert final_state.anomalies
    assert final_state.health
    assert final_state.risk
    assert final_state.recommendations
    assert final_state.auditor
    assert final_state.overall_confidence is not None
    assert len(final_state.execution_trace) >= 12
    assert "forecast_agent" in final_state.completed_agents
    assert "auditor_agent" in final_state.completed_agents


def test_orchestrator_failure_handling_continues_pipeline():
    class FailingForecastOrchestrator(FinancialOrchestrator):
        async def run_forecast_agent(self, state):
            await self._run_agent(
                state=state,
                agent_name="forecast_agent",
                action=lambda: (_ for _ in ()).throw(RuntimeError("forecast unavailable")),
            )

    state = _state_from_df(_sample_df())

    final_state = asyncio.run(FailingForecastOrchestrator().run_pipeline(state))

    assert final_state.pipeline_status == "PARTIAL"
    assert "forecast_agent" in final_state.failed_agents
    assert final_state.risk
    assert final_state.recommendations
    assert final_state.auditor
    assert any(event["event"] == "failed" for event in final_state.execution_trace)


def test_analysis_service_preserves_frontend_contract():
    result = asyncio.run(analyze(_sample_df()))

    assert result["kpi"]
    assert result["kpis"] == result["kpi"]
    assert result["forecast"]
    assert result["anomalies"]
    assert result["risk"]
    assert result["recommendations"]
    assert result["health_score"]
    assert result["auditor"]
    assert result["execution_trace"]
    assert result["pipeline_status"] in {"COMPLETED", "PARTIAL"}
    assert result["state"]["overall_confidence"] == result["overall_confidence"]


def test_orchestrator_execution_stages_and_metadata():
    state = _state_from_df(_sample_df())
    orchestrator = FinancialOrchestrator()
    final_state = asyncio.run(orchestrator.run_pipeline(state))

    # 1. Validate metadata
    assert "execution_graph" in final_state.preprocessing
    assert "execution_order" in final_state.preprocessing
    
    graph = final_state.preprocessing["execution_graph"]
    order = final_state.preprocessing["execution_order"]
    
    assert order == [
        orchestrator.STAGE_1_FOUNDATION,
        orchestrator.STAGE_2_FANOUT,
        orchestrator.STAGE_3_SYNTHESIS,
        orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS,
    ]
    
    assert graph[orchestrator.STAGE_1_FOUNDATION] == ["preprocessing", "kpis", "ratios"]
    assert "forecast_agent" in graph[orchestrator.STAGE_2_FANOUT]
    assert "risk_agent" in graph[orchestrator.STAGE_3_SYNTHESIS]
    assert "auditor_agent" in graph[orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS]

    # 2. Validate stage traces and timing
    stage_traces = [t for t in final_state.execution_trace if "stage" in t]
    assert len(stage_traces) == 8  # 4 stages * 2 events (started, completed) per stage
    
    # Check that stage event ordering is correct
    events_order = [(t["stage"], t["event"]) for t in stage_traces]
    expected_order = [
        (orchestrator.STAGE_1_FOUNDATION, "started"),
        (orchestrator.STAGE_1_FOUNDATION, "completed"),
        (orchestrator.STAGE_2_FANOUT, "started"),
        (orchestrator.STAGE_2_FANOUT, "completed"),
        (orchestrator.STAGE_3_SYNTHESIS, "started"),
        (orchestrator.STAGE_3_SYNTHESIS, "completed"),
        (orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS, "started"),
        (orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS, "completed"),
    ]
    assert events_order == expected_order

    # Check duration_ms exists for completed stage events
    for t in stage_traces:
        if t["event"] == "completed":
            assert "duration_ms" in t
            assert isinstance(t["duration_ms"], (int, float))
            assert t["duration_ms"] >= 0.0

    # 3. Validate timing on individual completed agent trace events
    agent_traces = [t for t in final_state.execution_trace if "agent" in t and t["event"] in ("completed", "failed") and t["agent"] != "orchestrator"]
    for t in agent_traces:
        assert "details" in t
        assert "duration_ms" in t["details"]
        assert isinstance(t["details"]["duration_ms"], (int, float))
        assert t["details"]["duration_ms"] >= 0.0

    # 4. Verify dependency boundaries inside trace
    # Let's inspect the entire execution trace to ensure correct ordering of agents inside stage boundaries.
    trace = final_state.execution_trace
    
    # Find indices of stage started and completed events in full trace
    indices = {}
    for i, t in enumerate(trace):
        if "stage" in t:
            indices[(t["stage"], t["event"])] = i
        elif "agent" in t:
            indices[(t["agent"], t["event"])] = i

    # Forecast, Anomalies, and Health (Stage 2) must execute between STAGE 2 started and completed
    s2_start = indices[(orchestrator.STAGE_2_FANOUT, "started")]
    s2_end = indices[(orchestrator.STAGE_2_FANOUT, "completed")]
    
    for agent in ["forecast_agent", "anomaly_agent", "health_agent"]:
        assert s2_start < indices[(agent, "started")] < s2_end
        assert s2_start < indices[(agent, "completed")] < s2_end

    # Risk and Recommendations (Stage 3) must execute between STAGE 3 started and completed
    s3_start = indices[(orchestrator.STAGE_3_SYNTHESIS, "started")]
    s3_end = indices[(orchestrator.STAGE_3_SYNTHESIS, "completed")]
    
    for agent in ["risk_agent", "recommendation_agent"]:
        assert s3_start < indices[(agent, "started")] < s3_end
        assert s3_start < indices[(agent, "completed")] < s3_end
        
    # Dependency order verification inside Stage 3: Risk must complete before Recommendation starts
    assert indices[("risk_agent", "completed")] < indices[("recommendation_agent", "started")]

    # Auditor (Stage 4) must execute between STAGE 4 started and completed
    s4_start = indices[(orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS, "started")]
    s4_end = indices[(orchestrator.STAGE_4_EXECUTIVE_SYNTHESIS, "completed")]
    assert s4_start < indices[("auditor_agent", "started")] < s4_end
    assert s4_start < indices[("auditor_agent", "completed")] < s4_end
