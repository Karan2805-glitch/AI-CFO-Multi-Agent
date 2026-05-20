from pydantic import BaseModel, Field
from typing import List, Dict, Any

class AgentFinding(BaseModel):
    title: str
    description: str
    severity: str = "INFO"

class AgentWarning(BaseModel):
    message: str
    impact: str = "MEDIUM"

# ---------------------------------------------------------
# 🏗️ AgentResponse Architecture
# ---------------------------------------------------------
# Why it exists: Provides a unified, structured output schema for all backend agents.
# This ensures consistency, simplifies LangGraph orchestration later, and makes 
# the AI responses more structured and predictable without altering core business logic.
class AgentResponse(BaseModel):
    agent: str
    status: str = "success"
    confidence: float = 0.0
    summary: str = ""
    # Using default_factory to prevent shared mutable state across instances
    findings: List[AgentFinding] = Field(default_factory=list)
    warnings: List[AgentWarning] = Field(default_factory=list)
    reasoning: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Why raw_data is preserved: It holds the original, machine-consumable output
    # (e.g., specific flags, raw anomalies) exactly as downstream services or 
    # the frontend expect them, ensuring backward compatibility.
    raw_data: Dict[str, Any] = Field(default_factory=dict)
