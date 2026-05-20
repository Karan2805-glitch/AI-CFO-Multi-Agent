from app.core.response_models import AgentResponse

def flatten_agent_response(response: AgentResponse) -> dict:
    """
    Adapter Layer: Flattens the AgentResponse to preserve frontend compatibility.
    
    Why this exists: 
    - Prevents breaking changes in the frontend while we upgrade backend architecture.
    - Ensures that old components accessing dict keys like `result["risk"]["risk_level"]` 
      still work exactly as before, since those keys are inside `raw_data`.
    
    Why raw_data is overlaid: 
    - Safely prioritizes frontend contracts (`raw_data` fields) over new schema fields 
      if there happens to be a collision, preventing silent overwrites and runtime errors.
    """
    dump = response.model_dump()
    
    return {
        **dump,
        **dump.get("raw_data", {})
    }
