"""
LangGraph Orchestration Layer for AI-CFO Pipeline.

This module wraps the existing FinancialOrchestrator runtime in a LangGraph
StateGraph.  Business logic stays in the orchestrator and agent modules —
LangGraph provides graph topology metadata, execution visualization, and
a foundation for future graph-native features (conditional edges, streaming).

Design decisions:
- FinancialOrchestrator remains the source of truth for execution.
- LangGraph nodes delegate to orchestrator stage methods.
- Graph metadata (nodes, edges, topology) is exported for visualization.
- Import is optional-safe: if langgraph is missing, the module raises a
  clear ImportError at import time rather than crashing FastAPI at startup.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Optional-safe import: fail loudly only when this module is imported,
# not when the rest of the app starts.
# ---------------------------------------------------------------------------
try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False

from app.core.state import FinancialAnalysisState
from app.orchestration.orchestrator import FinancialOrchestrator

# ---------------------------------------------------------------------------
# Graph topology metadata — matches the real orchestration flow exactly:
#   Foundation -> Forecast | Anomaly | Health -> Risk -> Recommendations -> Auditor
# ---------------------------------------------------------------------------

GRAPH_NODES: List[str] = [
    "foundation",
    "forecast",
    "anomaly",
    "health",
    "risk",
    "recommendation",
    "auditor",
]

GRAPH_EDGES: List[List[str]] = [
    ["foundation", "forecast"],
    ["foundation", "anomaly"],
    ["foundation", "health"],
    ["forecast", "risk"],
    ["anomaly", "risk"],
    ["health", "risk"],
    ["risk", "recommendation"],
    ["recommendation", "auditor"],
]

STAGE_MAP: Dict[str, str] = {
    "foundation": "stage_1_foundation",
    "forecast": "stage_2_fanout",
    "anomaly": "stage_2_fanout",
    "health": "stage_2_fanout",
    "risk": "stage_3_synthesis",
    "recommendation": "stage_3_synthesis",
    "auditor": "stage_4_executive_synthesis",
}


def export_graph_metadata() -> Dict[str, Any]:
    """Return serialization-safe graph metadata for API/frontend consumption."""
    return {
        "nodes": GRAPH_NODES,
        "edges": GRAPH_EDGES,
        "stage_map": STAGE_MAP,
    }


# ---------------------------------------------------------------------------
# LangGraph pipeline builder
# ---------------------------------------------------------------------------

def _build_langgraph_pipeline() -> Any:
    """Build and compile a LangGraph StateGraph wrapping the orchestrator.

    Returns the compiled graph application, or None if langgraph is unavailable.
    """
    if not LANGGRAPH_AVAILABLE:
        return None

    orchestrator = FinancialOrchestrator()

    # --- Node functions: thin wrappers around orchestrator stage methods ---

    async def foundation_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 1: Validate preprocessing data and inject graph metadata."""
        state.add_execution_event(
            agent="foundation", event="started",
            node="foundation", stage="stage_1_foundation",
        )
        start = time.perf_counter()

        if not state.preprocessing:
            state.mark_agent_failed(
                "foundation", "Missing preprocessing data",
                node="foundation", stage="stage_1_foundation",
            )
            return state.model_dump()

        # Inject visualization metadata into state
        state.preprocessing["graph_snapshot"] = export_graph_metadata()

        duration_ms = (time.perf_counter() - start) * 1000.0
        state.mark_agent_completed(
            "foundation", details={"duration_ms": duration_ms},
            node="foundation", stage="stage_1_foundation",
        )
        return state.model_dump()

    async def forecast_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 2 fan-out: Forecast agent — writes only state.forecast."""
        await orchestrator.run_forecast_agent(state)
        return state.model_dump()

    async def anomaly_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 2 fan-out: Anomaly agent — writes only state.anomalies."""
        await orchestrator.run_anomaly_agent(state)
        return state.model_dump()

    async def health_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 2 fan-out: Health agent — writes only state.health."""
        await orchestrator.run_health_agent(state)
        return state.model_dump()

    async def risk_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 3 synthesis: Risk agent — reads fan-out outputs."""
        await orchestrator.run_risk_agent(state)
        return state.model_dump()

    async def recommendation_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 3 synthesis: Recommendation agent — reads risk output."""
        await orchestrator.run_recommendation_agent(state)
        return state.model_dump()

    async def auditor_node(state: FinancialAnalysisState) -> Dict[str, Any]:
        """Stage 4 executive synthesis: Auditor agent — reads all outputs."""
        await orchestrator.run_auditor_agent(state)
        return state.model_dump()

    # --- Build graph ---
    graph = StateGraph(FinancialAnalysisState)

    graph.add_node("foundation", foundation_node)
    graph.add_node("forecast", forecast_node)
    graph.add_node("anomaly", anomaly_node)
    graph.add_node("health", health_node)
    graph.add_node("risk", risk_node)
    graph.add_node("recommendation", recommendation_node)
    graph.add_node("auditor", auditor_node)

    # Entry point
    graph.set_entry_point("foundation")

    # Stage 1 -> Stage 2 fan-out
    graph.add_edge("foundation", "forecast")
    graph.add_edge("foundation", "anomaly")
    graph.add_edge("foundation", "health")

    # Stage 2 -> Stage 3 fan-in
    graph.add_edge("forecast", "risk")
    graph.add_edge("anomaly", "risk")
    graph.add_edge("health", "risk")

    # Stage 3 sequential
    graph.add_edge("risk", "recommendation")

    # Stage 3 -> Stage 4
    graph.add_edge("recommendation", "auditor")

    # Terminal
    graph.add_edge("auditor", END)

    return graph.compile()


# Build once at module level (lazy — only if langgraph is installed)
langgraph_app = _build_langgraph_pipeline()
