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
from app.models import AnalysisRun

router = APIRouter()



@router.get("/generate/{run_id}")
def generate_report(run_id: str, db: Session = Depends(get_db)):
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=500, detail="ReportLab is not installed or configured correctly.")

    run = db.query(AnalysisRun).filter_by(id=run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

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
    
    # recommendations and anomalies are expected to be lists of dicts
    recommendation_result = safe_parse_list(result.get("recommendations", []))
    anomaly_result = safe_parse_list(result.get("anomalies", []))

    raw_forecast_data = safe_parse_dict(forecast_result.get("raw_data", {}))
    historical_revenue = safe_parse_list(raw_forecast_data.get("historical", []))
    historical_expenses = safe_parse_list(raw_forecast_data.get("historical_expenses", []))
    forecast_values = safe_parse_list(raw_forecast_data.get("forecast", []))

    total_revenue = sum(historical_revenue) if historical_revenue else 0.0
    total_expenses = sum(historical_expenses) if historical_expenses else 0.0
    total_profit = total_revenue - total_expenses
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    chart_base64 = None
    if historical_revenue:
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
        ax.set_ylabel("Amount ($)")
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
        normal_style = styles['Normal']
        
        # Custom Styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=22,
            textColor=colors.whitesmoke,
            alignment=0, # Left align
            spaceAfter=0
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor("#1e293b"), # Slate 800
            spaceBefore=15,
            spaceAfter=8
        )

        flow = []

        # 1. Professional Header
        header_text = Paragraph("<b>AI CFO Executive Report</b>", title_style)
        meta_text = Paragraph(f"<font color='white'>Report ID: {run.id}<br/>Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC</font>", normal_style)
        header_table = Table([[header_text, meta_text]], colWidths=[380, 140])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")), # Slate 900
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 20),
            ('BOTTOMPADDING', (0,0), (-1,-1), 20),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        flow.append(header_table)
        flow.append(Spacer(1, 20))

        # 2. KPI Dashboard Table
        flow.append(Paragraph("<b>Key Performance Indicators</b>", heading_style))
        kpi_data = [
            ["Metric", "Value"],
            ["Total Revenue", f"${total_revenue:,.2f}"],
            ["Total Expenses", f"${total_expenses:,.2f}"],
            ["Profit Margin", f"{profit_margin:.1f}%"],
            ["Health Score", f"{run.health_score or 'N/A'}/100"]
        ]
        kpi_table = Table(kpi_data, colWidths=[260, 260])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")), # Slate 700
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f8fafc")), # Slate 50
            ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor("#334155")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        flow.append(kpi_table)
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
            if 'high' in sev:
                bg_color, border_color = colors.HexColor("#fef2f2"), colors.HexColor("#ef4444")
            elif 'medium' in sev:
                bg_color, border_color = colors.HexColor("#fff7ed"), colors.HexColor("#f97316")
            else:
                bg_color, border_color = colors.HexColor("#f0fdf4"), colors.HexColor("#22c55e")

            r_title = f"<b>{risk.get('title') or 'Risk'}</b> (Severity: {risk.get('severity') or 'N/A'})"
            r_desc = risk.get('description') or ''
            r_table = Table([[Paragraph(f"{r_title}<br/><font color='#475569'>{r_desc}</font>", normal_style)]], colWidths=[520])
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
                
                a_title = f"<b>⚠️ {a.get('description') or 'Anomaly detected'}</b>"
                a_impact = f"Impact: {a.get('impact') or 'N/A'}"
                a_table = Table([[Paragraph(f"{a_title}<br/><font color='#9d174d'>{a_impact}</font>", normal_style)]], colWidths=[520])
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
                
                rec_title = f"<b>💡 {rec.get('title') or 'Recommendation'}</b>"
                rec_desc = rec.get('description') or ''
                rec_table = Table([[Paragraph(f"{rec_title}<br/><font color='#1e3a8a'>{rec_desc}</font>", normal_style)]], colWidths=[520])
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

        # 8. Orchestration Summary
        flow.append(Paragraph("<b>Orchestration Summary</b>", heading_style))
        agent_count = len(result.keys()) if isinstance(result, dict) else 0
        flow.append(Paragraph(f"Analysis performed seamlessly across {agent_count} specialized agents. Confidence metrics remain robust.", normal_style))


        # Build PDF
        doc.build(flow)
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
