from typing import Any, Callable, Dict, Optional
import asyncio
import time

import pandas as pd

from app.agents.anomaly_agent import detect_anomalies
from app.agents.auditor_agent import generate_explanation
from app.agents.forecast_agent import generate_forecast, prepare_forecast_output
from app.agents.health_agent import calculate_health_score
from app.agents.recommendation_agent import generate_recommendations
from app.agents.risk_agent import assess_risk
from app.core.state import FinancialAnalysisState
from app.services.response_adapter import flatten_agent_response


class FinancialOrchestrator:
    """Coordinates the 4-stage financial analysis pipeline."""

    STAGE_1_FOUNDATION = "stage_1_foundation"
    STAGE_2_FANOUT = "stage_2_fanout"
    STAGE_3_SYNTHESIS = "stage_3_synthesis"
    STAGE_4_EXECUTIVE_SYNTHESIS = "stage_4_executive_synthesis"

    async def run_pipeline(self, state: FinancialAnalysisState) -> FinancialAnalysisState:
        try:
            state.set_pipeline_status("INITIALIZING")
            state.add_execution_event(agent="orchestrator", event="started", details={"pipeline": "financial_analysis"})
            state.set_pipeline_status("RUNNING")

            state.preprocessing["execution_graph"] = {
                self.STAGE_1_FOUNDATION: ["preprocessing", "kpis", "ratios"],
                self.STAGE_2_FANOUT: ["forecast_agent", "anomaly_agent", "health_agent"],
                self.STAGE_3_SYNTHESIS: ["risk_agent", "recommendation_agent"],
                self.STAGE_4_EXECUTIVE_SYNTHESIS: ["auditor_agent"]
            }
            state.preprocessing["execution_order"] = [
                self.STAGE_1_FOUNDATION,
                self.STAGE_2_FANOUT,
                self.STAGE_3_SYNTHESIS,
                self.STAGE_4_EXECUTIVE_SYNTHESIS
            ]

            await self.run_stage_1_foundation(state)
            await self.run_stage_2_intelligence_fanout(state)
            await self.run_stage_3_synthesis(state)
            await self.run_stage_4_executive_synthesis(state)

            state.calculate_overall_confidence()
            state.set_pipeline_status("PARTIAL" if state.failed_agents else "COMPLETED")
            state.add_execution_event(
                agent="orchestrator",
                event="completed",
                details={"completed_agents": state.completed_agents, "failed_agents": state.failed_agents},
            )
        except Exception as exc:
            state.set_pipeline_status("FAILED")
            state.mark_agent_failed("orchestrator", str(exc))

        return state

    async def run_stage_1_foundation(self, state: FinancialAnalysisState) -> None:
        """Stage 1: Validate that preprocessing, KPIs, and ratios are present."""
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_1_FOUNDATION, "started")
        try:
            if not state.preprocessing or not state.kpis or not state.ratios:
                raise ValueError("Missing critical foundation data (preprocessing, kpis, or ratios)")
            state.add_stage_event(self.STAGE_1_FOUNDATION, "completed", duration_ms=(time.perf_counter() - start_time) * 1000.0)
        except Exception as exc:
            state.add_stage_event(self.STAGE_1_FOUNDATION, "failed", duration_ms=(time.perf_counter() - start_time) * 1000.0, details={"error": str(exc)})
            state.mark_agent_failed("stage_1_foundation", str(exc))

    async def run_stage_2_intelligence_fanout(self, state: FinancialAnalysisState) -> None:
        """Stage 2: Run forecast, anomaly, and health agents in parallel via asyncio.gather + thread pool."""
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_2_FANOUT, "started")
        try:
            results = await asyncio.gather(
                self.run_forecast_agent(state),
                self.run_anomaly_agent(state),
                self.run_health_agent(state),
                return_exceptions=True
            )
            for agent_name, result in zip(["forecast_agent", "anomaly_agent", "health_agent"], results):
                if isinstance(result, Exception):
                    state.mark_agent_failed(agent_name, str(result))
                    state.warnings.append(f"{agent_name} parallel task exception: {str(result)}")
            state.add_stage_event(self.STAGE_2_FANOUT, "completed", duration_ms=(time.perf_counter() - start_time) * 1000.0)
        except Exception as exc:
            state.add_stage_event(self.STAGE_2_FANOUT, "failed", duration_ms=(time.perf_counter() - start_time) * 1000.0, details={"error": str(exc)})
            state.mark_agent_failed("stage_2_fanout", str(exc))

    async def run_stage_3_synthesis(self, state: FinancialAnalysisState) -> None:
        """Stage 3: Run risk and recommendation agents sequentially (each depends on prior outputs)."""
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_3_SYNTHESIS, "started")
        try:
            await self.run_risk_agent(state)
            await self.run_recommendation_agent(state)
            state.add_stage_event(self.STAGE_3_SYNTHESIS, "completed", duration_ms=(time.perf_counter() - start_time) * 1000.0)
        except Exception as exc:
            state.add_stage_event(self.STAGE_3_SYNTHESIS, "failed", duration_ms=(time.perf_counter() - start_time) * 1000.0, details={"error": str(exc)})
            state.mark_agent_failed("stage_3_synthesis", str(exc))

    async def run_stage_4_executive_synthesis(self, state: FinancialAnalysisState) -> None:
        """Stage 4: Run auditor agent — terminal node that consumes all prior outputs."""
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "started")
        try:
            await self.run_auditor_agent(state)
            state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "completed", duration_ms=(time.perf_counter() - start_time) * 1000.0)
        except Exception as exc:
            state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "failed", duration_ms=(time.perf_counter() - start_time) * 1000.0, details={"error": str(exc)})
            state.mark_agent_failed("stage_4_executive_synthesis", str(exc))

    async def run_forecast_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "forecast_agent", lambda: self._execute_forecast(state))

    async def run_anomaly_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "anomaly_agent", lambda: self._assign_agent_output(
            state, "anomalies", detect_anomalies(self._dataframe_from_state(state))
        ))

    async def run_health_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "health_agent", lambda: self._assign_agent_output(
            state, "health", calculate_health_score(
                self._dataframe_from_state(state), state.kpis, state.ratios, self._risk_for_health(state)
            )
        ))

    async def run_risk_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "risk_agent", lambda: self._assign_agent_output(
            state, "risk", assess_risk(
                state.kpis, state.ratios, self._dataframe_from_state(state), state.forecast, state.anomalies
            )
        ))

    async def run_recommendation_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "recommendation_agent", lambda: self._assign_agent_output(
            state, "recommendations", generate_recommendations(
                state.kpis, state.ratios, state.risk or {}, self._dataframe_from_state(state),
                state.forecast, state.anomalies
            )
        ))

    async def run_auditor_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(state, "auditor_agent", lambda: self._assign_agent_output(
            state, "auditor", generate_explanation(
                state.kpis, state.ratios, state.forecast, state.anomalies, state.risk,
                state.recommendations, state.health,
                (state.recommendations or {}).get("recommendations", [])
            )
        ))

    async def _run_agent(self, state: FinancialAnalysisState, agent_name: str, action: Callable[[], None]) -> None:
        """Dispatch a synchronous agent to the thread pool so it doesn't block the event loop."""
        state.add_execution_event(agent=agent_name, event="started")
        agent_start = time.perf_counter()
        try:
            await asyncio.to_thread(action)
        except Exception as exc:
            state.mark_agent_failed(agent_name, str(exc), details={"duration_ms": (time.perf_counter() - agent_start) * 1000.0})
            return
        state.mark_agent_completed(agent_name, details={"duration_ms": (time.perf_counter() - agent_start) * 1000.0})

    def _execute_forecast(self, state: FinancialAnalysisState) -> None:
        df = self._dataframe_from_state(state)
        forecast_values, model_used = generate_forecast(df)
        state.forecast = flatten_agent_response(prepare_forecast_output(df, forecast_values, model_used))

    def _assign_agent_output(self, state: FinancialAnalysisState, field_name: str, agent_response: Any) -> None:
        setattr(state, field_name, flatten_agent_response(agent_response))

    def _risk_for_health(self, state: FinancialAnalysisState) -> Dict[str, Any]:
        """Return current risk or a neutral fallback if risk_agent hasn't run yet."""
        if state.risk:
            return state.risk
        msg = "health_agent used neutral risk context because risk_agent has not run yet"
        state.warnings.append(msg)
        state.add_execution_event(agent="health_agent", event="warning", details={"reason": msg})
        return {"risk_level": "LOW"}

    def _dataframe_from_state(self, state: FinancialAnalysisState) -> pd.DataFrame:
        records = state.preprocessing.get("dataframe_records", [])
        columns = state.preprocessing.get("dataframe_columns")
        df = pd.DataFrame.from_records(records, columns=columns)
        for col in state.preprocessing.get("datetime_columns", []):
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce")
        return df
