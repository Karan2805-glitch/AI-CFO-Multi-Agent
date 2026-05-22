import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  AlertTriangle, Info, BrainCircuit, Target,
  Zap, TrendingUp, ShieldAlert, Database, AlertCircle, ArrowRight
} from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import HealthScoreGauge from '../components/dashboard/HealthScoreGauge';
import RevenueForecastChart from '../components/dashboard/charts/RevenueForecastChart';
import { useData } from '../context/DataContext';

const fmt = (v) => `₹${(v / 1000000).toFixed(2)}M`;

// ── Shared Tooltip ────────────────────────────────────────────────────────────
const CustomTip = ({ active, payload, label, formatter, nameFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{
        background: 'rgba(7,11,20,0.96)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {label && <p className="text-slate-400 mb-2 font-semibold tracking-wider uppercase text-[10px]">{label}</p>}
      {payload.map((p, i) => {
        const val = formatter ? formatter(p.value) : p.value;
        const name = nameFormatter ? nameFormatter(p.name) : p.name;
        return (
          <div key={i} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            {name && <span className="text-slate-300">{name}:</span>}
            <span className="font-bold" style={{ color: p.color || p.fill }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Anomaly Alert Card ────────────────────────────────────────────────────────
const AlertCard = ({ a }) => {
  const styles = {
    critical: { border: 'rgba(244,63,94,0.3)', bg: 'rgba(244,63,94,0.08)', icon: '#F43F5E', glow: 'rgba(244,63,94,0.15)' },
    warning:  { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)', icon: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
    info:     { border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.08)', icon: '#3B82F6', glow: 'rgba(59,130,246,0.15)' },
  };
  const s = styles[a.severity] ?? styles.info;
  const Icon = a.severity === 'info' ? Info : AlertTriangle;

  return (
    <div
      className="group relative flex items-start gap-4 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'rgba(13,21,38,0.55)',
        border: `1px solid ${s.border}`,
        boxShadow: `0 4px 20px ${s.glow}`,
      }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: s.bg, border: `1px solid ${s.border}` }}
      >
        <Icon size={18} color={s.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
          <p className="text-sm font-bold text-slate-100">{a.title}</p>
          <span 
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider"
            style={{ background: s.bg, color: s.icon, border: `1px solid ${s.border}` }}
          >
            {a.deviation}
          </span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed font-medium">{a.detail}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.icon }} />
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Category: {a.category}</p>
        </div>
      </div>
    </div>
  );
};

// ── Recommendation Card ───────────────────────────────────────────────────────
const RecCard = ({ r, i }) => {
  const c = {
    red:    { color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
    amber:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    blue:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    purple: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  }[r.color] ?? { color: '#10B981', bg: 'rgba(16,185,129,0.1)' };

  return (
    <div
      className="group relative flex items-start gap-4 rounded-xl p-5 transition-all duration-300 hover:border-white/20"
      style={{
        background: 'rgba(13,21,38,0.55)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black mt-0.5"
        style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}40` }}
      >
        {i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <p className="text-[14px] font-bold text-slate-100 flex-1">{r.action}</p>
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}40` }}
          >
            {r.priority} PRIORITY
          </span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed mb-3">{r.rationale}</p>
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase">Impact: {r.impact}</span>
        </div>
      </div>
      <ArrowRight size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
    </div>
  );
};

// ── Health Score Detail ───────────────────────────────────────────────────────
const HealthScoreDetail = ({ healthScore }) => (
  <div
    className="rounded-2xl p-6 glass flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden"
    style={{
      background: 'rgba(13,21,38,0.65)',
      border: '1px solid rgba(16,185,129,0.2)',
      boxShadow: '0 8px 32px rgba(16,185,129,0.1)',
    }}
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none" />
    
    <div className="shrink-0 relative z-10">
       <HealthScoreGauge score={healthScore.score} />
    </div>

    <div className="flex-1 w-full flex flex-col gap-4 relative z-10">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Diagnostic Profile</h3>
        <span className="text-xs font-bold text-emerald-400">{healthScore.label}</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {healthScore.breakdown.map((b) => (
          <div key={b.name} className="flex items-center gap-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-36 shrink-0">{b.name}</p>
            <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000" 
                style={{ width: `${b.score}%` }} 
              />
            </div>
            <p className="text-[11px] font-black w-8 text-right text-slate-200">{b.score}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Scenario Analysis ─────────────────────────────────────────────────────────
const ScenarioAnalysis = ({ scenarioData }) => (
  <div
    className="rounded-2xl p-5"
    style={{
      background: 'rgba(13,21,38,0.65)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(139,92,246,0.15)',
      boxShadow: '0 4px 24px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
    }}
  >
    <div className="flex items-center gap-3 mb-6 px-1">
      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
        <Target size={15} className="text-purple-400" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-100">Scenario Analysis</h3>
        <p className="text-[11px] text-slate-500">What-if projections for net profit</p>
      </div>
    </div>
    
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={scenarioData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="scenario" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
        <Tooltip content={<CustomTip formatter={(v) => fmt(v)} nameFormatter={() => 'Net Profit'} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
        <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={24}>
          {scenarioData.map((d, i) => (
            <Cell 
              key={i} 
              fill={d.profit >= (scenarioData[0]?.profit ?? 0) ? '#10B981' : '#F43F5E'} 
              opacity={0.9} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ── Forecast Page ─────────────────────────────────────────────────────────────
const Forecast = () => {
  const {
    revenueTrend,
    expenseTrend,
    forecastTrend,
    anomalyAlerts,
    recommendations,
    healthScore,
    scenarioData,
    risk,
    auditorExplanation,
    isReal
  } = useAnalysis();

  return (
    <div className="flex flex-col gap-8 pb-10 page-enter">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Forecast Engine</h2>
          <p className="text-slate-400 text-sm mt-1">Anomaly detection, forward projections, and AI guidance</p>
        </div>
        {isReal && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        )}
      </section>

      {/* ── CENTRAL FORECAST PROJECTION CHART ────────────────────────── */}
      <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <RevenueForecastChart 
          revenueTrend={revenueTrend} 
          forecast={forecastTrend} 
          expenseTrend={expenseTrend}
        />
      </section>

      {/* ── RISK & AUDITOR ────────────────────────────────────────────── */}
      {(risk || auditorExplanation) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {risk && (
            <div 
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: 'rgba(244,63,94,0.05)',
                border: '1px solid rgba(244,63,94,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-red-400" />
                <h3 className="text-sm font-bold text-red-300 uppercase tracking-widest">Risk Level: {risk.risk_level}</h3>
              </div>
              {risk.risk_flags?.length > 0 && (
                <ul className="space-y-1.5 mt-2">
                  {risk.risk_flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-200/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-2" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {auditorExplanation && (
            <div 
              className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
              style={{
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl" />
              <div className="flex items-center gap-3 relative z-10">
                <BrainCircuit size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest">AI Auditor Briefing</h3>
              </div>
              <p className="text-sm text-blue-100/90 leading-relaxed relative z-10">{auditorExplanation}</p>
            </div>
          )}
        </section>
      )}

      {/* ── HEALTH & SCENARIO ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HealthScoreDetail healthScore={healthScore} />
        <ScenarioAnalysis scenarioData={scenarioData} />
      </section>

      {/* ── ANOMALIES ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Zap size={15} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">AI-Detected Anomalies</h3>
            <p className="text-[11px] text-slate-500">Statistically significant deviations from baseline</p>
          </div>
          <span className="ml-auto text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
            {anomalyAlerts.length} ALERTS
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {anomalyAlerts.map((a) => <AlertCard key={a.id} a={a} />)}
        </div>
      </section>

      {/* ── RECOMMENDATIONS ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Target size={15} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Strategic Action Plan</h3>
            <p className="text-[11px] text-slate-500">Curated steps based on projection engine</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 stagger">
          {recommendations.map((r, i) => <RecCard key={r.id} r={r} i={i} />)}
        </div>
      </section>
      
    </div>
  );
};

export default Forecast;
