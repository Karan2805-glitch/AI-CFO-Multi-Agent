import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import google.generativeai as genai
from app.db import get_db
from app.models import AnalysisRun

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user" or "ai"/"model"/"assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    run_id: Optional[str] = None
    history: List[ChatMessage] = []

@router.post("/message")
async def chat_message(req: ChatRequest, db: Session = Depends(get_db)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the backend server."
        )

    # 1. Gather context from AnalysisRun if provided
    system_instruction = (
        "You are an expert AI Chief Financial Officer (CFO) and financial advisory assistant. "
        "Your tone is professional, strategic, clear, and insightful. "
        "Help the user analyze their financial performance, diagnose problems, explain anomalies, and plan budgets."
    )

    if req.run_id:
        run = db.query(AnalysisRun).filter_by(id=req.run_id).first()
        if run and run.result:
            result = run.result
            kpis = result.get("kpi", {})
            risk = result.get("risk", {})
            anomalies = result.get("anomalies", {})
            auditor = result.get("auditor", {})
            recs = result.get("insights", {}).get("recommendations", [])

            # Construct clean, text-based financial context
            financial_context = (
                f"\n\n--- BUSINESS FINANCIAL CONTEXT ---\n"
                f"Active Run ID: {run.id}\n"
                f"Health Score: {run.health_score}/100\n"
                f"Risk Level: {run.risk_level}\n"
            )

            if kpis:
                financial_context += (
                    f"Core KPIs:\n"
                    f"  - Total Revenue: {kpis.get('total_revenue')}\n"
                    f"  - Total Expenses: {kpis.get('expenses')}\n"
                    f"  - Net Profit: {kpis.get('profit')}\n"
                    f"  - Profit Margin: {kpis.get('profit_margin')}\n"
                )

            if risk:
                financial_context += f"Dominant Risk Factors: {risk.get('details', {}).get('dominant_risk_factor', 'None')}\n"

            if anomalies:
                financial_context += f"Anomalies Count: {anomalies.get('anomaly_count', 0)}\n"

            if recs:
                financial_context += "Key Recommendations:\n"
                for i, r in enumerate(recs[:4]):
                    financial_context += f"  {i+1}. {r}\n"

            if auditor and auditor.get("summary"):
                financial_context += f"Executive Synthesis Summary: {auditor.get('summary')}\n"

            financial_context += (
                "\nUse this financial context to answer the user's questions specifically and professionally. "
                "Keep answers relatively concise, business-focused, and action-oriented. "
                "If they ask questions not related to this financial report, answer them as a highly skilled CFO helper."
            )
            system_instruction += financial_context

    # 2. Configure Gemini
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="models/gemini-2.5-flash",
            system_instruction=system_instruction
        )

        # 3. Format history for Gemini SDK
        # Gemini expects format: [{"role": "user"|"model", "parts": [text]}]
        gemini_history = []
        for msg in req.history:
            role = "model" if msg.role in ["ai", "assistant", "model"] else "user"
            gemini_history.append({"role": role, "parts": [msg.content]})

        # 4. Start chat session and get response
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(req.message)

        return {
            "status": "success",
            "reply": response.text.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to communicate with Gemini API: {str(e)}"
        )
