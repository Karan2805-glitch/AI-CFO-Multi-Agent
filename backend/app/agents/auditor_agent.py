import os
import json

def generate_explanation(kpis, ratios, risk, recommendations):
    profit_margin = kpis.get("profit_margin", 0)
    total_exp_ratio = ratios.get("total_expense_ratio", 0)
    expense_ratios = ratios.get("expense_ratios", {})
    risk_level = risk.get("risk_level", "UNKNOWN")

    # ---------------------------------------------------------
    # 🤖 FALLBACK RULE-BASED GENERATOR
    # ---------------------------------------------------------
    def rule_based_fallback():
        explanation_parts = []
        explanation_parts.append(
            f"The company has a profit margin of {profit_margin}%, "
            f"with total expenses accounting for {total_exp_ratio}% of revenue."
        )

        high_costs = [(k.replace("_ratio", "").title(), v) for k, v in expense_ratios.items() if v > 25]
        if high_costs:
            cost_str = ", ".join([f"{name} ({value}%)" for name, value in high_costs])
            explanation_parts.append(f"Significant cost contributors include: {cost_str}.")

        explanation_parts.append(f"Based on these metrics, the financial risk is classified as {risk_level}.")
        
        if recommendations:
            explanation_parts.append("Machine learning insights have identified specific efficiency and growth pipelines.")

        return " ".join(explanation_parts)

    # ---------------------------------------------------------
    # 🧠 GEN-AI LLM INTEGRATION (Primary)
    # ---------------------------------------------------------
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            payload = {
                "profit_margin": profit_margin,
                "total_expense_ratio": total_exp_ratio,
                "risk_level": risk_level,
                "high_expenses": {k: v for k, v in expense_ratios.items() if v > 20},
                "recommendations": recommendations[:3] # top 3
            }
            
            prompt = f"""
            You are an expert AI Chief Financial Officer. 
            Review these metrics: {json.dumps(payload)}
            
            Write a 2-paragraph professional executive summary briefing explaining the financial health, 
            key risks, and top priority actions. Do not use asterisks or markdown formatting. Be concise and authoritative.
            """
            
            response = model.generate_content(prompt)
            return {
                "summary": response.text.strip(),
                "details": [response.text.strip()]
            }
        except Exception as e:
            print(f"GenAI Auditor Failed: {e}. Falling back to Rule-Based.")
            pass # fallback to rule based

    # Fallback return
    return {
        "summary": rule_based_fallback(),
        "details": [rule_based_fallback()]
    }