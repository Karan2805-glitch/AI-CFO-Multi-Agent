# Updated FinancialAnalysisState with LangGraph reducers and enhanced trace methods

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Annotated

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------
PipelineStatus = Literal[
    "NOT_STARTED",
    "INITIALIZING",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "PARTIAL",
]

TraceEvent = Literal[
    "started",
    "completed",
    "failed",
    "warning",
    "status_changed",
    "confidence_calculated",
]

# ---------------------------------------------------------------------------
# Helper reducers for LangGraph list merging (simple concatenation while preserving order)
# ---------------------------------------------------------------------------

def _merge_lists(a: List[Any], b: List[Any]) -> List[Any]:
    """Concatenate two lists while removing exact duplicates that already exist.
    This is sufficient for our execution_trace and agent lists because events are
    unique per node execution.
    """
    merged = a.copy()
    for item in b:
        if item not in merged:
            merged.append(item)
    return merged

def merge_execution_trace(a: List[Dict[str, Any]], b: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return _merge_lists(a, b)

def merge_agents(a: List[str], b: List[str]) -> List[str]:
    return _merge_lists(a, b)

def merge_warnings(a: List[str], b: List[str]) -> List[str]:
    return _merge_lists(a, b)

# ---------------------------------------------------------------------------
# State model
# ---------------------------------------------------------------------------
class FinancialAnalysisState(BaseModel):
    """Central execution state for orchestration‑ready financial analysis.
    The model is deliberately lightweight – all heavy data lives in the
    ``preprocessing`` dict.  The added ``Annotated`` fields enable LangGraph to
    merge parallel node outputs without losing any trace information.
    """

    # -----------------------------------------------------------------------
    # Core payload (unchanged)
    # -----------------------------------------------------------------------
    session_id: Optional[str] = None
    uploaded_filename: Optional[str] = None
    raw_dataframe_summary: Dict[str, Any] = Field(default_factory=dict)

    preprocessing: Dict[str, Any] = Field(default_factory=dict)
    ratios: Dict[str, Any] = Field(default_factory=dict)
    kpis: Dict[str, Any] = Field(default_factory=dict)

    forecast: Optional[Dict[str, Any]] = None
    anomalies: Optional[Dict[str, Any]] = None
    risk: Optional[Dict[str, Any]] = None
    recommendations: Optional[Dict[str, Any]] = None
    health: Optional[Dict[str, Any]] = None
    auditor: Optional[Dict[str, Any]] = None

    # -----------------------------------------------------------------------
    # Execution monitoring – wrapped with list‑merge reducers for LangGraph
    # -----------------------------------------------------------------------
    execution_trace: Annotated[List[Dict[str, Any]], merge_execution_trace] = Field(
        default_factory=list
    )
    completed_agents: Annotated[List[str], merge_agents] = Field(default_factory=list)
    failed_agents: Annotated[List[str], merge_agents] = Field(default_factory=list)
    warnings: Annotated[List[str], merge_warnings] = Field(default_factory=list)

    pipeline_status: PipelineStatus = "NOT_STARTED"
    overall_confidence: Optional[float] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

    # -----------------------------------------------------------------------
    # Trace helpers – now accept optional ``node`` and ``stage`` for richer UI
    # -----------------------------------------------------------------------
    def add_execution_event(
        self,
        agent: str,
        event: TraceEvent,
        details: Optional[Dict[str, Any]] = None,
        node: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> None:
        ev: Dict[str, Any] = {
            "agent": agent,
            "event": event,
            "timestamp": self._utc_now(),
            "details": details or {},
        }
        if node:
            ev["node"] = node
        if stage:
            ev["stage"] = stage
        self.execution_trace.append(ev)

    def mark_agent_completed(
        self,
        agent_name: str,
        details: Optional[Dict[str, Any]] = None,
        node: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> None:
        if agent_name not in self.completed_agents:
            self.completed_agents.append(agent_name)
        self.add_execution_event(
            agent=agent_name,
            event="completed",
            details=details,
            node=node,
            stage=stage,
        )

    def mark_agent_failed(
        self,
        agent_name: str,
        reason: str,
        details: Optional[Dict[str, Any]] = None,
        node: Optional[str] = None,
        stage: Optional[str] = None,
    ) -> None:
        if agent_name not in self.failed_agents:
            self.failed_agents.append(agent_name)
        self.warnings.append(f"{agent_name} failed: {reason}")
        merged_details = {"reason": reason}
        if details:
            merged_details.update(details)
        self.add_execution_event(
            agent=agent_name,
            event="failed",
            details=merged_details,
            node=node,
            stage=stage,
        )

    def add_stage_event(
        self,
        stage: str,
        event: Literal["started", "completed", "failed"],
        duration_ms: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        ev: Dict[str, Any] = {
            "stage": stage,
            "event": event,
            "timestamp": self._utc_now(),
            "details": details or {},
        }
        if duration_ms is not None:
            ev["duration_ms"] = duration_ms
        self.execution_trace.append(ev)

    # -----------------------------------------------------------------------
    # Pipeline status management (unchanged)
    # -----------------------------------------------------------------------
    def set_pipeline_status(self, status: PipelineStatus) -> None:
        self.pipeline_status = status
        if status == "RUNNING" and self.started_at is None:
            self.started_at = self._utc_now()
        if status in {"COMPLETED", "FAILED", "PARTIAL"}:
            self.completed_at = self._utc_now()
        self.add_execution_event(
            agent="orchestrator",
            event="status_changed",
            details={"status": status},
        )

    # -----------------------------------------------------------------------
    # Confidence calculation (unchanged)
    # -----------------------------------------------------------------------
    def calculate_overall_confidence(self) -> Optional[float]:
        confidence_values = [
            confidence
            for confidence in (
                self._extract_confidence(self.forecast),
                self._extract_confidence(self.risk),
                self._extract_confidence(self.recommendations),
                self._extract_confidence(self.auditor),
            )
            if confidence is not None
        ]
        if not confidence_values:
            self.overall_confidence = None
            return self.overall_confidence
        self.overall_confidence = round(
            sum(confidence_values) / len(confidence_values),
            4,
        )
        self.add_execution_event(
            agent="orchestrator",
            event="confidence_calculated",
            details={
                "sources": len(confidence_values),
                "overall_confidence": self.overall_confidence,
            },
        )
        return self.overall_confidence

    # -----------------------------------------------------------------------
    # Utility helpers (unchanged)
    # -----------------------------------------------------------------------
    def has_agent_output(self, agent_name: str) -> bool:
        output_name = agent_name.removesuffix("_agent")
        if output_name == "recommendation":
            output_name = "recommendations"
        return getattr(self, output_name, None) is not None

    @staticmethod
    def _extract_confidence(output: Optional[Dict[str, Any]]) -> Optional[float]:
        if not output:
            return None
        value = output.get("confidence", output.get("confidence_score"))
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _utc_now() -> str:
        return datetime.now(timezone.utc).isoformat()
