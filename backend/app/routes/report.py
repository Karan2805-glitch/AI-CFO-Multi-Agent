from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
import os
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json


try:
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app.db import get_db
from app.models import AnalysisRun, Session as DBSession

router = APIRouter()



@router.get("/generate/{run_id}")
def generate_report(run_id: str, db: Session = Depends(get_db)):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=500, detail="ReportLab is not installed or configured correctly.")

    run = db.query(AnalysisRun).filter_by(id=run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    user_session = db.query(DBSession).filter_by(id=run.session_id).first()
    username = user_session.username if user_session and user_session.username else "Unknown User"
    company = user_session.company if user_session and user_session.company else "Unknown Company"
    industry = user_session.industry if user_session and user_session.industry else "Unknown Industry"

    def safe_parse_dict(val):
        while isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, str) and parsed == val:
                    break
                val = parsed
            except Exception:
                break
        return val if isinstance(val, dict) else {}

    def safe_parse_list(val):
        while isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, str) and parsed == val:
                    break
                val = parsed
            except Exception:
                break
        return val if isinstance(val, list) else []

    result = safe_parse_dict(run.result)
    
    # Extract required fields for the report
    auditor_result = safe_parse_dict(result.get("auditor", {}))
    forecast_result = safe_parse_dict(result.get("forecast", {}))
    risk_result = safe_parse_dict(result.get("risk", {}))
    
    def get_normalized_anomalies(res_dict):
        raw_anomalies = res_dict.get("anomalies")
        if not raw_anomalies:
            return []
        if isinstance(raw_anomalies, list):
            return raw_anomalies
        if isinstance(raw_anomalies, dict):
            detailed = raw_anomalies.get("anomalies_detailed")
            if isinstance(detailed, list) and detailed:
                return detailed
            findings = raw_anomalies.get("findings")
            if isinstance(findings, list) and findings:
                return findings
            anom_list = raw_anomalies.get("anomalies")
            if isinstance(anom_list, list) and anom_list:
                return anom_list
        return []

    def get_normalized_recommendations(res_dict):
        raw_recs = res_dict.get("recommendations")
        if not raw_recs:
            return []
        if isinstance(raw_recs, list):
            return raw_recs
        if isinstance(raw_recs, dict):
            detailed = raw_recs.get("recommendations_detailed")
            if isinstance(detailed, list) and detailed:
                return detailed
            findings = raw_recs.get("findings")
            if isinstance(findings, list) and findings:
                return findings
            recs_list = raw_recs.get("recommendations")
            if isinstance(recs_list, list) and recs_list:
                return recs_list
        return []

    # recommendations and anomalies are expected to be lists of dicts
    recommendation_result = get_normalized_recommendations(result)
    anomaly_result = get_normalized_anomalies(result)

    raw_forecast_data = safe_parse_dict(forecast_result.get("raw_data", {}))
    historical_revenue = safe_parse_list(raw_forecast_data.get("historical", forecast_result.get("historical", [])))
    historical_expenses = safe_parse_list(raw_forecast_data.get("historical_expenses", forecast_result.get("historical_expenses", [])))
    forecast_values = safe_parse_list(raw_forecast_data.get("forecast", forecast_result.get("forecast", [])))

    kpis = safe_parse_dict(result.get("kpi", result.get("kpis", {})))
    total_revenue = kpis.get("total_revenue")
    total_expenses = kpis.get("total_expenses")
    total_profit = kpis.get("profit")
    profit_margin = kpis.get("profit_margin")
    avg_monthly_revenue = kpis.get("avg_monthly_revenue")

    if total_revenue is None:
        total_revenue = sum(historical_revenue) if historical_revenue else 0.0
    if total_expenses is None:
        total_expenses = sum(historical_expenses) if historical_expenses else 0.0
    if total_profit is None:
        total_profit = total_revenue - total_expenses
    if profit_margin is None:
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    chart_base64 = None
    if historical_revenue:
        plt.rcParams.update({
            'font.family': 'sans-serif',
            'font.sans-serif': ['Arial', 'Helvetica', 'sans-serif'],
            'font.size': 9,
            'text.color': '#555555',
            'axes.labelcolor': '#555555',
            'xtick.color': '#555555',
            'ytick.color': '#555555'
        })
        fig, ax = plt.subplots(figsize=(8, 4))
        periods = range(1, len(historical_revenue) + 1)
        ax.plot(periods, historical_revenue, marker='o', label="Revenue", color="#3b82f6")
        
        if historical_expenses and len(historical_expenses) == len(historical_revenue):
            ax.plot(periods, historical_expenses, marker='x', label="Expenses", color="#ef4444")
            
        if forecast_values:
            fc_periods = range(len(historical_revenue), len(historical_revenue) + len(forecast_values) + 1)
            fc_lines = [historical_revenue[-1]] + forecast_values
            ax.plot(fc_periods, fc_lines, linestyle='--', marker='o', color="#8b5cf6", label="Forecast")
            
        ax.set_title("Financial Trend & Forecast")
        ax.set_ylabel("Amount (₹)")
        ax.set_xlabel("Periods")
        ax.legend()
        ax.grid(True, linestyle=':', alpha=0.6)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        plt.close(fig)
        buf.seek(0)
        chart_base64 = base64.b64encode(buf.read()).decode('utf-8')


    # Define variables used later
    anomalies = anomaly_result
    recommendations = recommendation_result

    try:
        # Ensure ReportLab is available
        if not REPORTLAB_AVAILABLE:
            raise HTTPException(status_code=500, detail="ReportLab is not installed or configured correctly.")

        # Build PDF using ReportLab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=LETTER, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=30)
        styles = getSampleStyleSheet()
        # Custom Styles
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            textColor=colors.HexColor("#333333"),
            leading=14
        )
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=colors.whitesmoke, # White text on blue bg
            alignment=0, # Left align
            spaceAfter=0
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.HexColor("#2C3E50"),
            spaceBefore=15,
            spaceAfter=8
        )

        flow = []

        # 1. Professional Header (Blue background)
        header_text = Paragraph("<b>AI CFO Executive Report</b>", title_style)
        meta_html = f"<font color='white'>Report ID: {run.id}<br/>Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC<br/>"
        meta_html += f"Prepared for: <b>{username}</b><br/>Company: {company} ({industry})</font>"
        meta_text = Paragraph(meta_html, normal_style)
        
        header_table = Table([[header_text, meta_text]], colWidths=[330, 190])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1E3A5F")), # Dark Blue bg
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        flow.append(header_table)
        flow.append(Spacer(1, 20))

        # 2. KPI Dashboard Table
        flow.append(Paragraph("<b>Key Performance Indicators</b>", heading_style))
        kpi_data = [
            ["Metric", "Value"],
            ["Total Revenue", f"₹{total_revenue:,.2f}"],
            ["Total Expenses", f"₹{total_expenses:,.2f}"],
            ["Profit Margin", f"{profit_margin:.1f}%"],
            ["Health Score", f"{run.health_score or 'N/A'}/100"]
        ]
        kpi_table = Table(kpi_data, colWidths=[260, 260])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2F5597")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 11),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
            ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        flow.append(kpi_table)
        flow.append(Spacer(1, 15))

        # Expense Breakdown Analysis
        expense_breakdown = safe_parse_dict(kpis.get("expense_breakdown", {}))
        if expense_breakdown:
            flow.append(Paragraph("<b>Expense Allocation Analysis</b>", heading_style))
            exp_data = [["Expense Category", "Allocated Amount", "Ratio of Total"]]
            total_exp_sum = sum(expense_breakdown.values()) or 1.0
            for cat, val in expense_breakdown.items():
                ratio = (val / total_exp_sum * 100)
                exp_data.append([cat.replace("_", " ").title(), f"₹{val:,.2f}", f"{ratio:.1f}%"])
            exp_table = Table(exp_data, colWidths=[200, 160, 160])
            exp_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2C3E50")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
                ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            flow.append(exp_table)
            flow.append(Spacer(1, 15))

        # 3. Executive Summary
        flow.append(Paragraph("<b>Executive Summary</b>", heading_style))
        exec_summary_text = auditor_result.get("summary") or "No executive summary available."
        flow.append(Paragraph(str(exec_summary_text), normal_style))
        flow.append(Spacer(1, 15))

        # 4. Strategic Outlook + Chart
        flow.append(Paragraph("<b>Strategic Outlook</b>", heading_style))
        outlook_text = forecast_result.get("summary") or "No strategic outlook available."
        flow.append(Paragraph(str(outlook_text), normal_style))
        flow.append(Spacer(1, 10))
        if chart_base64:
            chart_bytes = base64.b64decode(chart_base64)
            img = Image(io.BytesIO(chart_bytes), width=450, height=225)
            img.hAlign = 'CENTER'
            flow.append(img)
            flow.append(Spacer(1, 15))

        # Scenario Forecast Table
        scenarios = safe_parse_dict(forecast_result.get("scenarios", {}))
        if scenarios:
            flow.append(Paragraph("<b>Scenario Forecast Projections</b>", heading_style))
            flow.append(Paragraph("Projections represent expected monthly revenues over the next 3 planning periods under different execution scenarios:", normal_style))
            flow.append(Spacer(1, 6))
            scen_data = [["Scenario", "Period t+1", "Period t+2", "Period t+3"]]
            for scen_name in ["optimistic", "expected", "pessimistic"]:
                if scen_name in scenarios:
                    vals = scenarios[scen_name]
                    formatted_vals = [f"₹{v:,.2f}" if isinstance(v, (int, float)) else str(v) for v in vals]
                    scen_data.append([scen_name.title()] + formatted_vals)
            scen_table = Table(scen_data, colWidths=[140, 126, 126, 126])
            scen_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2F5597")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
                ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            flow.append(scen_table)
            flow.append(Spacer(1, 15))

        # 5. Risk Overview (Color Coded by Severity)
        flow.append(Paragraph("<b>Risk Overview</b>", heading_style))
        flow.append(Paragraph(f"Overall Risk Level: <b>{run.risk_level or 'UNKNOWN'}</b>", normal_style))
        flow.append(Spacer(1, 8))
        
        risk_findings = safe_parse_list(risk_result.get("findings", []))
        anomalies = anomaly_result
        recommendations = recommendation_result
        
        for risk in risk_findings:
            if isinstance(risk, str):
                risk = safe_parse_dict(risk)
            if not isinstance(risk, dict): continue
            
            sev = str(risk.get('severity', 'Low')).lower()
            text_color = "white"
            if 'critical' in sev:
                bg_color, border_color = colors.HexColor("#991b1b"), colors.HexColor("#7f1d1d") # Dark Red
            elif 'high' in sev:
                bg_color, border_color = colors.HexColor("#dc2626"), colors.HexColor("#b91c1c") # Red
            elif 'medium' in sev:
                bg_color, border_color = colors.HexColor("#ea580c"), colors.HexColor("#c2410c") # Orange
            else:
                bg_color, border_color = colors.HexColor("#16a34a"), colors.HexColor("#15803d") # Green

            r_title = f"<b><font color='{text_color}'>{risk.get('title') or 'Risk'} (Severity: {risk.get('severity') or 'N/A'})</font></b>"
            r_desc = f"<font color='{text_color}'>{risk.get('description') or ''}</font>"
            r_table = Table([[Paragraph(f"{r_title}<br/>{r_desc}", normal_style)]], colWidths=[520])
            r_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), bg_color),
                ('BOX', (0,0), (-1,-1), 1, border_color),
                ('PADDING', (0,0), (-1,-1), 10),
            ]))
            flow.append(r_table)
            flow.append(Spacer(1, 6))

        # 6. Anomaly Summary (Red Highlights)
        flow.append(Paragraph("<b>Anomaly Summary</b>", heading_style))
        if anomalies:
            for a in anomalies:
                if isinstance(a, str):
                    a = safe_parse_dict(a)
                if not isinstance(a, dict): continue
                
                a_desc = a.get('explanation') or a.get('description') or 'Anomaly detected'
                a_type = a.get('type') or a.get('title') or 'Financial Anomaly'
                a_sev = a.get('severity') or 'MEDIUM'
                a_period = a.get('time_period') or ''
                a_impact = a.get('business_impact') or ''
                a_rec = a.get('recommended_action') or ''
                
                header_html = f"<b>⚠️ {a_type}</b> ({a_period})" if a_period else f"<b>⚠️ {a_type}</b>"
                content_html = f"<b>Explanation:</b> {a_desc}<br/><b>Severity:</b> <font color='#991b1b'><b>{a_sev}</b></font>"
                if a_impact:
                    content_html += f"<br/><b>Business Impact:</b> {a_impact}"
                if a_rec:
                    content_html += f"<br/><b>Recommended Mitigation:</b> {a_rec}"
                
                a_table = Table([[Paragraph(f"{header_html}<br/>{content_html}", normal_style)]], colWidths=[520])
                a_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fdf2f8")), # Pink 50
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#ec4899")), # Pink 500
                    ('PADDING', (0,0), (-1,-1), 10),
                ]))
                flow.append(a_table)
                flow.append(Spacer(1, 6))
        else:
            flow.append(Paragraph("<i>No significant anomalies detected.</i>", normal_style))
            flow.append(Spacer(1, 10))

        # 7. Recommendation Board (Blue Highlights)
        flow.append(Paragraph("<b>Recommendation Board</b>", heading_style))
        if recommendations:
            for rec in recommendations:
                if isinstance(rec, str):
                    rec = safe_parse_dict(rec)
                if not isinstance(rec, dict): continue
                
                rec_title = rec.get('title') or 'Financial Action Recommendation'
                rec_desc = rec.get('recommendation') or rec.get('description') or ''
                rec_reason = rec.get('reasoning') or ''
                rec_prio = rec.get('priority') or 'HIGH'
                rec_outcome = rec.get('expected_outcome') or ''
                
                header_html = f"<b>💡 {rec_title}</b>"
                content_html = f"<b>Action Item:</b> {rec_desc}<br/><b>Priority:</b> <font color='#1e3a8a'><b>{rec_prio}</b></font>"
                if rec_reason:
                    content_html += f"<br/><b>Reasoning:</b> {rec_reason}"
                if rec_outcome:
                    content_html += f"<br/><b>Expected Outcome:</b> {rec_outcome}"
                
                rec_table = Table([[Paragraph(f"{header_html}<br/>{content_html}", normal_style)]], colWidths=[520])
                rec_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")), # Blue 50
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3b82f6")), # Blue 500
                    ('PADDING', (0,0), (-1,-1), 10),
                ]))
                flow.append(rec_table)
                flow.append(Spacer(1, 6))
        else:
            flow.append(Paragraph("<i>No recommendations available.</i>", normal_style))
            flow.append(Spacer(1, 10))

        # 8. Orchestration & Performance Overview
        flow.append(Paragraph("<b>Orchestration & Performance Overview</b>", heading_style))
        pipeline_status = result.get("pipeline_status", "COMPLETED")
        overall_confidence = result.get("overall_confidence")
        conf_str = f"{overall_confidence * 100:.1f}%" if isinstance(overall_confidence, (int, float)) else "N/A"
        
        flow.append(Paragraph(f"Multi-Agent pipeline execution status: <b>{pipeline_status}</b>. Overall execution confidence calculated at: <b>{conf_str}</b>.", normal_style))
        flow.append(Spacer(1, 6))
        
        orch_data = [["Specialized Agent / Stage", "Status", "Confidence / Key Contribution"]]
        
        agent_keys = {
            "forecast_agent": ("Forecast Agent", "forecast"),
            "anomaly_agent": ("Anomaly Detection Agent", "anomalies"),
            "health_agent": ("Health Assessment Agent", "health"),
            "risk_agent": ("Risk Assessment Agent", "risk"),
            "recommendation_agent": ("Strategic Recommendation Agent", "recommendations"),
            "auditor_agent": ("Executive Synthesis Agent", "auditor")
        }
        
        for agent_id, (agent_label, res_key) in agent_keys.items():
            agent_data = safe_parse_dict(result.get(res_key, {}))
            status = "COMPLETED" if agent_data else "NOT RUN"
            
            details = "N/A"
            if agent_data:
                conf = agent_data.get("confidence")
                conf_val = f"{conf * 100:.0f}%" if isinstance(conf, (int, float)) else ""
                
                if res_key == "forecast":
                    model = agent_data.get("metadata", {}).get("model_used", "ARIMA")
                    details = f"{model} Projections {f'(Confidence: {conf_val})' if conf_val else ''}"
                elif res_key == "anomalies":
                    count = agent_data.get("anomaly_count", 0)
                    details = f"{count} anomalies flagged {f'(Confidence: {conf_val})' if conf_val else ''}"
                elif res_key == "health":
                    details = f"Overall score: {agent_data.get('health_score') or 'N/A'}/100 {f'(Confidence: {conf_val})' if conf_val else ''}"
                elif res_key == "risk":
                    details = f"Risk Level: {agent_data.get('risk_level') or 'N/A'} {f'(Confidence: {conf_val})' if conf_val else ''}"
                elif res_key == "recommendations":
                    count = len(agent_data.get("recommendations", []))
                    details = f"{count} actions generated {f'(Confidence: {conf_val})' if conf_val else ''}"
                elif res_key == "auditor":
                    details = f"Executive Synthesis {f'(Confidence: {conf_val})' if conf_val else ''}"
            
            orch_data.append([agent_label, status, details])
            
        orch_table = Table(orch_data, colWidths=[180, 100, 240])
        orch_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2C3E50")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")),
            ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#333333")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        flow.append(orch_table)


        # Footer / Page No
        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor("#777777"))
            page_num = canvas.getPageNumber()
            text = f"AI CFO Executive Report  |  Page {page_num}"
            canvas.drawRightString(doc.pagesize[0] - 40, 20, text)
            canvas.restoreState()

        # Build PDF
        doc.build(flow, onFirstPage=add_page_number, onLaterPages=add_page_number)
        pdf_bytes = buffer.getvalue()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=executive_report_{run_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
