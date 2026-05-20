import pandas as pd

from app.core.state import FinancialAnalysisState
from app.orchestration.orchestrator import FinancialOrchestrator
from app.services.kpi_service import calculate_kpis
from app.services.preprocessing import preprocess
from app.services.ratio_service import calculate_ratios


async def analyze(df):
    # analysis_service now only prepares shared state and preserves the API
    # contract. Execution order and state mutation live in the orchestrator.
    processed_df = preprocess(df)
    kpis = calculate_kpis(processed_df)
    ratios = calculate_ratios(kpis)

    state = FinancialAnalysisState(
        raw_dataframe_summary=_dataframe_summary(processed_df),
        preprocessing=_dataframe_payload(processed_df),
        kpis=kpis,
        ratios=ratios,
    )

    final_state = await FinancialOrchestrator().run_pipeline(state)

    return {
        "kpi": final_state.kpis,
        "kpis": final_state.kpis,
        "ratios": final_state.ratios,
        "risk": final_state.risk or {},
        "recommendations": final_state.recommendations or {},
        "health_score": final_state.health or {},
        "health": final_state.health or {},
        "auditor": final_state.auditor or {},
        "forecast": final_state.forecast or {},
        "anomalies": final_state.anomalies or {},
        "execution_trace": final_state.execution_trace,
        "completed_agents": final_state.completed_agents,
        "failed_agents": final_state.failed_agents,
        "warnings": final_state.warnings,
        "pipeline_status": final_state.pipeline_status,
        "overall_confidence": final_state.overall_confidence,
        "state": final_state.model_dump(),
    }


def _dataframe_payload(df: pd.DataFrame) -> dict:
    serializable_df = df.copy()
    datetime_columns = []

    for column in serializable_df.columns:
        if pd.api.types.is_datetime64_any_dtype(serializable_df[column]):
            datetime_columns.append(column)
            serializable_df[column] = serializable_df[column].dt.strftime("%Y-%m-%dT%H:%M:%S")

    return {
        "dataframe_records": serializable_df.to_dict(orient="records"),
        "dataframe_columns": list(serializable_df.columns),
        "datetime_columns": datetime_columns,
        "row_count": int(len(serializable_df)),
        "column_count": int(len(serializable_df.columns)),
    }


def _dataframe_summary(df: pd.DataFrame) -> dict:
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": list(df.columns),
    }


# if __name__ == "__main__":
#     import pandas as pd
#
#     df = pd.read_csv("app/services/sample.csv")
#     result = analyze(df)
#     print(result)
