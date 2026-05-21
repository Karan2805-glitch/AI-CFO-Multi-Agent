"""
Focused tests for LangGraph integration, frontend contract keys,
and health_score DB extraction logic.
"""

import asyncio
import pytest
import pandas as pd

from app.core.state import FinancialAnalysisState
from app.services.analysis_service import analyze
from app.services.preprocessing import preprocess
from app.services.kpi_service import calculate_kpis
from app.services.ratio_service import calculate_ratios
from app.orchestration.langgraph_pipeline import LANGGRAPH_AVAILABLE, langgraph_app


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


# ─────────────────────────────────────────────────────────────────────
# LangGraph module import and metadata export
# ─────────────────────────────────────────────────────────────────────

def test_langgraph_module_imports_cleanly():
    """The langgraph_pipeline module should import without errors."""
    from app.orchestration.langgraph_pipeline import (
        LANGGRAPH_AVAILABLE,
        export_graph_metadata,
        GRAPH_NODES,
        GRAPH_EDGES,
    )
    # Module loaded; metadata functions exist
    assert callable(export_graph_metadata)
    assert isinstance(GRAPH_NODES, list)
    assert isinstance(GRAPH_EDGES, list)


def test_langgraph_graph_metadata_topology():
    """Exported graph metadata must match the documented pipeline topology:
    Foundation -> Forecast | Anomaly | Health -> Risk -> Recommendations -> Auditor
    """
    from app.orchestration.langgraph_pipeline import export_graph_metadata

    meta = export_graph_metadata()

    # All expected nodes present
    assert set(meta["nodes"]) == {
        "foundation", "forecast", "anomaly", "health",
        "risk", "recommendation", "auditor",
    }

    # Fan-out edges from foundation
    assert ["foundation", "forecast"] in meta["edges"]
    assert ["foundation", "anomaly"] in meta["edges"]
    assert ["foundation", "health"] in meta["edges"]

    # Fan-in edges to risk
    assert ["forecast", "risk"] in meta["edges"]
    assert ["anomaly", "risk"] in meta["edges"]
    assert ["health", "risk"] in meta["edges"]

    # Sequential synthesis
    assert ["risk", "recommendation"] in meta["edges"]

    # Terminal
    assert ["recommendation", "auditor"] in meta["edges"]


def test_langgraph_stage_map_correctness():
    """Each node must map to its correct pipeline stage."""
    from app.orchestration.langgraph_pipeline import STAGE_MAP

    assert STAGE_MAP["foundation"] == "stage_1_foundation"
    assert STAGE_MAP["forecast"] == "stage_2_fanout"
    assert STAGE_MAP["anomaly"] == "stage_2_fanout"
    assert STAGE_MAP["health"] == "stage_2_fanout"
    assert STAGE_MAP["risk"] == "stage_3_synthesis"
    assert STAGE_MAP["recommendation"] == "stage_3_synthesis"
    assert STAGE_MAP["auditor"] == "stage_4_executive_synthesis"


@pytest.mark.skipif(
    not LANGGRAPH_AVAILABLE or langgraph_app is None,
    reason="LangGraph runtime not available (missing langgraph package or compile failed)",
)
def test_langgraph_runtime_wrapper_executes_orchestrator():
    """The compiled LangGraph wrapper should delegate to FinancialOrchestrator."""
    processed_df = preprocess(_sample_df())
    kpis = calculate_kpis(processed_df)
    state = FinancialAnalysisState(
        raw_dataframe_summary={
            "row_count": int(len(processed_df)),
            "column_count": int(len(processed_df.columns)),
            "columns": list(processed_df.columns),
        },
        preprocessing={
            "dataframe_records": processed_df.assign(
                months=processed_df["months"].dt.strftime("%Y-%m-%dT%H:%M:%S")
            ).to_dict(orient="records"),
            "dataframe_columns": list(processed_df.columns),
            "datetime_columns": ["months"],
            "row_count": int(len(processed_df)),
            "column_count": int(len(processed_df.columns)),
        },
        kpis=kpis,
        ratios=calculate_ratios(kpis),
    )

    result = asyncio.run(langgraph_app.ainvoke(state))

    assert result["pipeline_status"] == "COMPLETED"
    assert result["forecast"]
    assert result["anomalies"]
    assert result["risk"]
    assert result["recommendations"]
    assert result["health"]
    assert result["auditor"]
    assert result["preprocessing"]["graph_snapshot"]["nodes"]


# ─────────────────────────────────────────────────────────────────────
# Frontend contract keys from analyze()
# ─────────────────────────────────────────────────────────────────────

def test_frontend_contract_keys_present():
    """The analyze() return dict must contain every key the frontend consumes."""
    result = asyncio.run(analyze(_sample_df()))

    # Primary dashboard keys
    required_keys = [
        "kpi", "forecast", "anomalies", "risk",
        "recommendations", "health_score", "auditor",
    ]
    for key in required_keys:
        assert key in result, f"Missing frontend contract key: {key}"
        assert result[key] is not None, f"Frontend contract key is None: {key}"

    # Execution observability keys
    assert "execution_trace" in result
    assert "pipeline_status" in result
    assert result["pipeline_status"] in {"COMPLETED", "PARTIAL"}


def test_frontend_contract_kpi_duplicate():
    """Both 'kpi' and 'kpis' must be present and identical for backward compat."""
    result = asyncio.run(analyze(_sample_df()))
    assert result["kpi"] == result["kpis"]


# ─────────────────────────────────────────────────────────────────────
# health_score DB extraction
# ─────────────────────────────────────────────────────────────────────

def test_health_score_extraction_from_dict():
    """compress_result produces a health_score dict; the route must extract an int."""
    # Simulate what the route does
    result = asyncio.run(analyze(_sample_df()))
    raw_health = result.get("health_score", {})

    # The health payload from analyze() is a dict (not an int)
    assert isinstance(raw_health, dict), "health_score from analyze() should be a dict"

    # Simulate the extraction logic from analyze.py route
    if isinstance(raw_health, dict):
        health_int = int(raw_health.get("overall_score", raw_health.get("score", 0)))
    else:
        health_int = int(raw_health) if raw_health else 0

    assert isinstance(health_int, int), "Extracted health_score must be int for DB"



