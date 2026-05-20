from typing import Any, Callable, Dict, Optional
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
    """Central coordinator for the financial analysis pipeline."""

    # The orchestrator owns execution flow only. Agent business logic remains in
    # agent modules, while shared state gives future fan-out/fan-in and LangGraph
    # nodes a stable contract for reading inputs and writing outputs.

    # Stage Constants
    STAGE_1_FOUNDATION = "stage_1_foundation"
    STAGE_2_FANOUT = "stage_2_fanout"
    STAGE_3_SYNTHESIS = "stage_3_synthesis"
    STAGE_4_EXECUTIVE_SYNTHESIS = "stage_4_executive_synthesis"

    async def run_pipeline(self, state: FinancialAnalysisState) -> FinancialAnalysisState:
        try:
            state.set_pipeline_status("INITIALIZING")
            state.add_execution_event(
                agent="orchestrator",
                event="started",
                details={"pipeline": "financial_analysis"},
            )
            state.set_pipeline_status("RUNNING")

            # Store the lightweight execution graph metadata for future LangGraph mapping and visualization
            state.preprocessing["execution_graph"] = {
                self.STAGE_1_FOUNDATION: ["preprocessing", "kpis", "ratios"],
                self.STAGE_2_FANOUT: ["forecast_agent", "anomaly_agent", "health_agent"],
                self.STAGE_3_SYNTHESIS: ["risk_agent", "recommendation_agent"],
                self.STAGE_4_EXECUTIVE_SYNTHESIS: ["auditor_agent"]
            }

            # Store execution order metadata inside shared state for future execution visualization
            state.preprocessing["execution_order"] = [
                self.STAGE_1_FOUNDATION,
                self.STAGE_2_FANOUT,
                self.STAGE_3_SYNTHESIS,
                self.STAGE_4_EXECUTIVE_SYNTHESIS
            ]

            # Execute the stages sequentially, preserving failure isolation across and within stages.
            await self.run_stage_1_foundation(state)
            await self.run_stage_2_intelligence_fanout(state)
            await self.run_stage_3_synthesis(state)
            await self.run_stage_4_executive_synthesis(state)

            state.calculate_overall_confidence()
            state.set_pipeline_status("PARTIAL" if state.failed_agents else "COMPLETED")
            state.add_execution_event(
                agent="orchestrator",
                event="completed",
                details={
                    "completed_agents": state.completed_agents,
                    "failed_agents": state.failed_agents,
                },
            )
        except Exception as exc:
            state.set_pipeline_status("FAILED")
            state.mark_agent_failed("orchestrator", str(exc))

        return state

    async def run_stage_1_foundation(self, state: FinancialAnalysisState) -> None:
        """
        STAGE 1: FOUNDATION
        - Preprocessing, KPI setup, and Ratio setup are established here.
        - Future LangGraph mapping: This stage represents the ingestion/validation stage node.
        - Dependencies: Depends on raw input data uploaded or supplied to the analysis service.
        """
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_1_FOUNDATION, "started")

        try:
            # Stage 1 executes preprocessing validation check.
            # Preprocessing, kpis, and ratios are expected to be pre-calculated by analysis_service.py.
            # We verify the presence of these in the shared state.
            if not state.preprocessing or not state.kpis or not state.ratios:
                raise ValueError("Missing critical foundation data (preprocessing, kpis, or ratios)")
            
            # Record stage completion
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_1_FOUNDATION, "completed", duration_ms=duration_ms)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_1_FOUNDATION, "failed", duration_ms=duration_ms, details={"error": str(exc)})
            state.mark_agent_failed("stage_1_foundation", str(exc))

    async def run_stage_2_intelligence_fanout(self, state: FinancialAnalysisState) -> None:
        """
        STAGE 2: FAN-OUT INTELLIGENCE (Concurrent Execution)
        - Executes forecast, anomaly, and health agents concurrently using asyncio.gather.
        - Parallel Safety: Strictly safe because fan-out nodes read the immutable foundation data
          and write strictly to independent keys (state.forecast, state.anomalies, state.health)
          with zero write collision risk or shared resources needing locks/mutexes.
        - Failure Isolation: Using return_exceptions=True ensures that a failure in one
          intelligence node does not disrupt the others or compromise downstream stages.
        """
        import asyncio
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_2_FANOUT, "started")

        try:
            # true parallel/concurrent execution via asyncio.gather with failure isolation
            results = await asyncio.gather(
                self.run_forecast_agent(state),
                self.run_anomaly_agent(state),
                self.run_health_agent(state),
                return_exceptions=True
            )

            # Process returned exceptions from asyncio.gather for robust observability and failure isolation
            for agent_name, result in zip(
                ["forecast_agent", "anomaly_agent", "health_agent"],
                results
            ):
                if isinstance(result, Exception):
                    state.mark_agent_failed(agent_name, str(result))
                    state.warnings.append(f"{agent_name} parallel task exception: {str(result)}")

            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_2_FANOUT, "completed", duration_ms=duration_ms)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_2_FANOUT, "failed", duration_ms=duration_ms, details={"error": str(exc)})
            state.mark_agent_failed("stage_2_fanout", str(exc))

    async def run_stage_3_synthesis(self, state: FinancialAnalysisState) -> None:
        """
        STAGE 3: SYNTHESIS INTELLIGENCE (Dependent Execution Nodes)
        - Executes risk and recommendation agents.
        - Future LangGraph mapping: Fan-in synchronization point where outputs of Stage 2 are analyzed.
        - Dependencies:
          - risk_agent depends on Stage 2 outputs (forecast, anomalies) and Stage 1 outputs (kpis, ratios).
          - recommendation_agent depends on risk_agent, Stage 2 outputs (forecast, anomalies), and Stage 1 outputs (kpis, ratios).
        """
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_3_SYNTHESIS, "started")

        try:
            # Risk Agent (depends on Stage 2 outputs)
            await self.run_risk_agent(state)

            # Recommendation Agent (depends on Risk and Stage 2 outputs)
            await self.run_recommendation_agent(state)

            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_3_SYNTHESIS, "completed", duration_ms=duration_ms)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_3_SYNTHESIS, "failed", duration_ms=duration_ms, details={"error": str(exc)})
            state.mark_agent_failed("stage_3_synthesis", str(exc))

    async def run_stage_4_executive_synthesis(self, state: FinancialAnalysisState) -> None:
        """
        STAGE 4: EXECUTIVE SYNTHESIS
        - Executes auditor agent to generate final explanations.
        - Future LangGraph mapping: The final terminal node of the graph.
        - Dependencies: Consumes all previous outputs (Stage 1, Stage 2, and Stage 3).
        """
        start_time = time.perf_counter()
        state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "started")

        try:
            # Auditor Agent
            await self.run_auditor_agent(state)

            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "completed", duration_ms=duration_ms)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            state.add_stage_event(self.STAGE_4_EXECUTIVE_SYNTHESIS, "failed", duration_ms=duration_ms, details={"error": str(exc)})
            state.mark_agent_failed("stage_4_executive_synthesis", str(exc))

    async def run_forecast_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="forecast_agent",
            action=lambda: self._execute_forecast(state),
        )

    async def run_anomaly_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="anomaly_agent",
            action=lambda: self._assign_agent_output(
                state,
                "anomalies",
                detect_anomalies(self._dataframe_from_state(state)),
            ),
        )

    async def run_health_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="health_agent",
            action=lambda: self._assign_agent_output(
                state,
                "health",
                calculate_health_score(
                    self._dataframe_from_state(state),
                    state.kpis,
                    state.ratios,
                    self._risk_for_health(state),
                ),
            ),
        )

    async def run_risk_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="risk_agent",
            action=lambda: self._assign_agent_output(
                state,
                "risk",
                assess_risk(
                    state.kpis,
                    state.ratios,
                    self._dataframe_from_state(state),
                    state.forecast,
                    state.anomalies,
                ),
            ),
        )

    async def run_recommendation_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="recommendation_agent",
            action=lambda: self._assign_agent_output(
                state,
                "recommendations",
                generate_recommendations(
                    state.kpis,
                    state.ratios,
                    state.risk or {},
                    self._dataframe_from_state(state),
                    state.forecast,
                    state.anomalies,
                ),
            ),
        )

    async def run_auditor_agent(self, state: FinancialAnalysisState) -> None:
        await self._run_agent(
            state=state,
            agent_name="auditor_agent",
            action=lambda: self._assign_agent_output(
                state,
                "auditor",
                generate_explanation(
                    state.kpis,
                    state.ratios,
                    state.forecast,
                    state.anomalies,
                    state.risk,
                    state.recommendations,
                    state.health,
                    (state.recommendations or {}).get("recommendations", []),
                ),
            ),
        )

    async def _run_agent(
        self,
        state: FinancialAnalysisState,
        agent_name: str,
        action: Callable[[], None],
    ) -> None:
        state.add_execution_event(agent=agent_name, event="started")
        agent_start = time.perf_counter()

        try:
            # Action runs synchronous agent business logic but wrapping inside
            # async executor nodes prepares them perfectly for future async/I-O tasks.
            action()
        except Exception as exc:
            duration_ms = (time.perf_counter() - agent_start) * 1000.0
            state.mark_agent_failed(agent_name, str(exc), details={"duration_ms": duration_ms})
            return

        duration_ms = (time.perf_counter() - agent_start) * 1000.0
        state.mark_agent_completed(agent_name, details={"duration_ms": duration_ms})

    def _execute_forecast(self, state: FinancialAnalysisState) -> None:
        df = self._dataframe_from_state(state)
        forecast_values, model_used = generate_forecast(df)
        forecast_response = prepare_forecast_output(df, forecast_values, model_used)
        state.forecast = flatten_agent_response(forecast_response)

    def _assign_agent_output(
        self,
        state: FinancialAnalysisState,
        field_name: str,
        agent_response: Any,
    ) -> None:
        setattr(state, field_name, flatten_agent_response(agent_response))

    def _risk_for_health(self, state: FinancialAnalysisState) -> Dict[str, Any]:
        if state.risk:
            return state.risk

        message = "health_agent used neutral risk context because risk_agent has not run yet"
        state.warnings.append(message)
        state.add_execution_event(
            agent="health_agent",
            event="warning",
            details={"reason": message},
        )
        return {"risk_level": "LOW"}

    def _dataframe_from_state(self, state: FinancialAnalysisState) -> pd.DataFrame:
        records = state.preprocessing.get("dataframe_records", [])
        columns = state.preprocessing.get("dataframe_columns")
        df = pd.DataFrame.from_records(records, columns=columns)

        for column in state.preprocessing.get("datetime_columns", []):
            if column in df.columns:
                df[column] = pd.to_datetime(df[column], errors="coerce")

        return df
