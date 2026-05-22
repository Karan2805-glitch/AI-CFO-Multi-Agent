import React from 'react';
import { AlertTriangle, Database, Loader2, FileText, Activity } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import RiskBadge from '../components/dashboard/RiskBadge';
import HealthScoreGauge from '../components/dashboard/HealthScoreGauge';
import ConfidenceBadge from '../components/dashboard/ConfidenceBadge';
import RevenueForecastChart from '../components/dashboard/charts/RevenueForecastChart';
import ExpenseBreakdownChart from '../components/dashboard/charts/ExpenseBreakdownChart';
import OrchestrationGraph from '../components/orchestration/OrchestrationGraph';
import OrchestrationTimeline from '../components/orchestration/OrchestrationTimeline';
import ExecutiveSynthesis from '../components/executive/ExecutiveSynthesis';
import RecommendationBoard from '../components/executive/RecommendationBoard';
import RiskDimensions from '../components/executive/RiskDimensions';
import AnomalySeverityPanel from '../components/executive/AnomalySeverityPanel';
import AIChatbot from '../components/AIChatbot';
import { useData } from '../context/DataContext';
import { useAnalysis } from '../hooks/useAnalysis';
import { downloadReport } from '../api/analyzeService';

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function Dashboard() {
  const { dashboardData, loading, error, runId, sessionId } = useData();
  const analysis = useAnalysis();

  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [generationError, setGenerationError] = React.useState(null);

  const handleGenerateReport = async () => {
    if (!runId) {
      setGenerationError("No run ID available for report generation.");
      return;
    }
    setIsGeneratingReport(true);
    setGenerationError(null);
    try {
      const blob = await downloadReport(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive_report_${runId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report generation failed:", err);
      setGenerationError(err.message || "Failed to generate report.");
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setGenerationError(null);
      }, 5000);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl glass border border-blue-500/30 flex items-center justify-center glow-blue shrink-0 relative z-10">
            <Loader2 size={28} className="animate-spin text-blue-400" />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Orchestrating AI Analysis...</p>
        <p className="text-xs text-slate-500">Running multi-agent intelligence pipeline</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="glass border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-red-200 flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-300">Pipeline Failed</p>
            <p className="text-sm text-red-200/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="glass border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Database size={24} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">AI-CFO Intelligence Platform</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Upload a financial dataset to activate the multi-agent orchestration pipeline and generate executive intelligence.
          </p>
        </div>
      </div>
    );
  }

  // Safe data extraction
  const kpis = dashboardData?.kpis ?? {};
  const healthScore = dashboardData?.health_score || 0;
  const riskLevel = dashboardData?.risk?.level;
  const riskFlags = safeArray(dashboardData?.risk?.details?.risk_flags);
  const revenueTrend = safeArray(dashboardData?.charts?.revenue_trend);
  const expenseTrend = safeArray(dashboardData?.charts?.expense_trend);
  const forecast = safeArray(dashboardData?.charts?.forecast);
  const expenseBreakdown = dashboardData?.charts?.expense_breakdown ?? {};

  return (
    <div className="flex flex-col gap-8 pb-10 page-enter">

      {/* ═══════════════════════════════════════════════════════════════
       * HEADER — AI-CFO Platform Branding
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Activity size={15} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">AI-CFO Command Center</h2>
          </div>
          <p className="text-slate-500 text-sm ml-11">Multi-agent orchestration intelligence platform</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {analysis.overallConfidence !== null && (
            <ConfidenceBadge value={analysis.overallConfidence} />
          )}
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="print-hide flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#C4B5FD',
            }}
          >
            {isGeneratingReport ? (
              <Loader2 size={14} className="animate-spin text-blue-400" />
            ) : (
              <FileText size={14} />
            )}
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)] print-hide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {analysis.pipelineStatus}
          </span>
          <RiskBadge level={riskLevel} size="lg" />
        </div>
      </section>

      {generationError && (
        <div className="glass border border-red-500/30 bg-red-500/10 rounded-xl p-4 text-red-200 flex items-center justify-between gap-4 animate-fade-in print-hide -mt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-300">Report Generation Failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{generationError}</p>
            </div>
          </div>
          <button 
            onClick={() => setGenerationError(null)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       * KPI + HEALTH SECTION — Quick Financial Snapshot
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 section-enter">
        {/* Health Score */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 rounded-3xl glass border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-50" />
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 text-center">Business Health</p>
          <HealthScoreGauge score={healthScore} />
        </div>

        {/* KPIs Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={kpis.total_revenue}
            themeKey="revenue"
            trend={1}
            trendLabel="Stable"
          />
          <KPICard
            label="Net Profit"
            value={kpis.profit}
            themeKey="profit"
            trend={1}
            trendLabel="Positive"
          />
          <KPICard
            label="Profit Margin"
            value={kpis.profit_margin}
            currency={false}
            suffix="%"
            themeKey="margin"
          />
          <KPICard
            label="Total Expenses"
            value={kpis.total_expenses}
            themeKey="expenses"
            trend={-1}
            trendLabel="Watch"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * EXECUTIVE SYNTHESIS — AI-Powered Intelligence
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="section-enter">
        <ExecutiveSynthesis
          auditorSummary={analysis.auditorSummary}
          strategicOutlook={analysis.strategicOutlook}
          executivePriorities={analysis.executivePriorities}
          uncertaintyLevel={analysis.uncertaintyLevel}
          uncertaintySummary={analysis.uncertaintySummary}
          dominantRisks={analysis.dominantRisks}
          conflictingSignals={analysis.conflictingSignals}
          auditorConfidence={analysis.auditorConfidence}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * ORCHESTRATION GRAPH — The Killer Feature
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="section-enter">
        <OrchestrationGraph
          executionGraph={analysis.executionGraph}
          completedAgents={analysis.completedAgents}
          failedAgents={analysis.failedAgents}
          pipelineStatus={analysis.pipelineStatus}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * RECOMMENDATION PRIORITY BOARD
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="section-enter">
        <RecommendationBoard recommendationsDetailed={analysis.recommendationsDetailed} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * EXECUTION TIMELINE + RISK INTELLIGENCE
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 section-enter">
        <OrchestrationTimeline
          completedAgents={analysis.completedAgents}
          failedAgents={analysis.failedAgents}
          pipelineStatus={analysis.pipelineStatus}
        />
        <RiskDimensions
          riskDimensions={analysis.riskDimensions}
          riskLevel={riskLevel}
          dominantRiskFactor={analysis.dominantRiskFactor}
          riskSummary={analysis.riskSummary}
          riskConfidence={analysis.riskConfidence}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * ANOMALY INTELLIGENCE + CHARTS (Supplementary)
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 section-enter">
        <AnomalySeverityPanel
          anomaliesDetailed={analysis.anomaliesDetailed}
          anomalyCount={analysis.anomalyCount}
          anomalySummary={analysis.anomalySummary}
          anomalyConfidence={analysis.anomalyConfidence}
        />
        <RevenueForecastChart
          revenueTrend={revenueTrend}
          forecast={forecast}
          expenseTrend={expenseTrend}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * EXPENSE BREAKDOWN (Supplementary)
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="section-enter">
        <ExpenseBreakdownChart expenseBreakdown={expenseBreakdown} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
       * AI ASSISTANT
       * ═══════════════════════════════════════════════════════════════ */}
      <section className="mt-2 print-hide">
        <AIChatbot />
      </section>

      {/* ── FOOTER TRACE ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-white/5 mt-4">
        <p className="text-[10px] text-slate-500 font-mono">Run ID: {runId || 'N/A'}</p>
        <p className="text-[10px] text-slate-500 font-mono">
          Pipeline: {analysis.pipelineStatus} · Agents: {analysis.completedAgents.length} completed
          {analysis.failedAgents.length > 0 && ` · ${analysis.failedAgents.length} failed`}
        </p>
        <p className="text-[10px] text-slate-500 font-mono">Session: {sessionId || 'N/A'}</p>
      </div>
    </div>
  );
}
