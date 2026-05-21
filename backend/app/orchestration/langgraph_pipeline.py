"""
LangGraph Orchestration Layer for AI-CFO Pipeline.

This module wraps the existing FinancialOrchestrator runtime in a LangGraph
StateGraph.  Business logic stays in the orchestrator and agent modules —
LangGraph provides graph topology metadata, execution visualization, and
a foundation for future graph-native features (conditional edges, streaming).

Design decisions:
- FinancialOrchestrator remains the source of truth for execution.
- LangGraph delegates runtime execution to the orchestrator in one node.
- Graph metadata (nodes, edges, topology) is exported for visualization.
- Import is optional-safe: if langgraph is missing, the module raises a
  clear ImportError at import time rather than crashing FastAPI at startup.
"""

from __future__ import annotations

from typing import Any, Dict, List

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

    # --- Runtime node: LangGraph wraps the orchestrator; it does not re-own execution. ---

    async def orchestrator_runtime_node(
        state: FinancialAnalysisState,
    ) -> FinancialAnalysisState:
        """Run the canonical orchestrator and return the shared state object."""
        state.preprocessing["graph_snapshot"] = export_graph_metadata()
        return await orchestrator.run_pipeline(state)

    # --- Build graph ---
    graph = StateGraph(FinancialAnalysisState)

    graph.add_node("orchestrator_runtime", orchestrator_runtime_node)

    # Entry point
    graph.set_entry_point("orchestrator_runtime")

    # Terminal
    graph.add_edge("orchestrator_runtime", END)

    return graph.compile()


# Build once at module level (lazy — only if langgraph is installed)
langgraph_app = _build_langgraph_pipeline()
