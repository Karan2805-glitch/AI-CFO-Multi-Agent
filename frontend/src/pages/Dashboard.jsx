import React from 'react';
import { AlertTriangle, Database, Loader2, ShieldAlert } from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import RiskBadge from '../components/dashboard/RiskBadge';
import HealthScoreGauge from '../components/dashboard/HealthScoreGauge';
import RecommendationList from '../components/dashboard/RecommendationList';
import InsightBox from '../components/dashboard/InsightBox';
import RevenueForecastChart from '../components/dashboard/charts/RevenueForecastChart';
import ExpenseBreakdownChart from '../components/dashboard/charts/ExpenseBreakdownChart';
import AIChatbot from '../components/AIChatbot';
import { useData } from '../context/DataContext';

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function Dashboard() {
  const { dashboardData, loading, error, runId, sessionId } = useData();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="w-16 h-16 rounded-2xl glass border border-blue-500/30 flex items-center justify-center glow-blue shrink-0 relative z-10">
            <Loader2 size={28} className="animate-spin text-blue-400" />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-300 tracking-wider uppercase">Running AI Analysis...</p>
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
            <p className="text-lg font-bold text-red-300">Analysis Failed</p>
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
          <h2 className="text-xl font-bold text-slate-100">No Dashboard Data</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Please upload a financial dataset to evaluate business health, identify risks, and generate actionable AI recommendations.
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
  const forecast = safeArray(dashboardData?.charts?.forecast);
  const expenseBreakdown = dashboardData?.charts?.expense_breakdown ?? {};
  const summary = dashboardData?.insights?.summary;
  const recommendations = safeArray(dashboardData?.insights?.recommendations);

  return (
    <div className="flex flex-col gap-8 pb-10 page-enter">
      
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Multi-Agent CFO intelligence report</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
          <RiskBadge level={riskLevel} size="lg" />
        </div>
      </section>

      {/* ── TOP SECTION (Executive Summary) ──────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Health Score Panel (Prominent) */}
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
            trend={1} // Example: +ve trend
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

      {/* ── MIDDLE SECTION (Analysis) ────────────────────────────────────── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueForecastChart revenueTrend={revenueTrend} forecast={forecast} />
        <ExpenseBreakdownChart expenseBreakdown={expenseBreakdown} />
      </section>

      {/* ── RISK FLAGS SECTION ───────────────────────────────────────────── */}
      {riskFlags.length > 0 && (
        <section 
          className="rounded-2xl p-6 glass"
          style={{
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert size={16} className="text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-red-300 uppercase tracking-widest">Identified Risk Factors</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskFlags.map((flag, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-red-500/10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2" />
                <p className="text-sm text-slate-300 leading-relaxed">{flag}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── INSIGHT SECTION (MOST IMPORTANT) ─────────────────────────────── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <InsightBox summary={summary} />
        </div>
        <div className="flex flex-col">
          <RecommendationList recommendations={recommendations} />
        </div>
      </section>

      {/* ── AI ASSISTANT SECTION (Chatbot) ───────────────────────────────── */}
      <section className="mt-2">
        <AIChatbot />
      </section>
      
      {/* ── FOOTER TRACE ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-white/5 mt-4">
        <p className="text-[10px] text-slate-500 font-mono">Run ID: {runId || 'N/A'}</p>
        <p className="text-[10px] text-slate-500 font-mono">Session: {sessionId || 'N/A'}</p>
      </div>

    </div>
  );
}
