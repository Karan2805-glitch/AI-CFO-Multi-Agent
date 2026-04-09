import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts';
import {
  AlertTriangle, Info, BrainCircuit, Target,
  CheckCircle2, Zap, TrendingUp
} from 'lucide-react';
import { anomalyAlerts, recommendations, healthScore, scenarioData, forecastData } from '../mockData';

const fmt = (v) => `$${(v / 1000000).toFixed(2)}M`;

// ── Anomaly Alert Card ────────────────────────────────────────────────────────
const AlertCard = ({ a }) => {
  const styles = {
    critical: { border: 'border-red-500/25',    bg: 'bg-red-500/8',    icon: 'text-red-400',    BIcon: AlertTriangle, label: 'bg-red-500/15 text-red-400' },
    warning:  { border: 'border-amber-500/25',  bg: 'bg-amber-500/8',  icon: 'text-amber-400',  BIcon: AlertTriangle, label: 'bg-amber-500/15 text-amber-400' },
    info:     { border: 'border-blue-500/25',   bg: 'bg-blue-500/8',   icon: 'text-blue-400',   BIcon: Info,          label: 'bg-blue-500/15 text-blue-400' },
  };
  const s = styles[a.severity];
  return (
    <div className={`glass border ${s.border} ${s.bg} rounded-xl p-4 flex gap-3`}>
      <s.BIcon size={18} className={`${s.icon} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-100">{a.title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.label} shrink-0`}>{a.deviation}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{a.detail}</p>
        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-semibold">Category: {a.category}</p>
      </div>
    </div>
  );
};

// ── Recommendation Card ───────────────────────────────────────────────────────
const RecCard = ({ r, i }) => {
  const c = {
    red:    { badge: 'bg-red-500/15 text-red-400',    dot: 'bg-red-500'    },
    amber:  { badge: 'bg-amber-500/15 text-amber-400',dot: 'bg-amber-500'  },
    blue:   { badge: 'bg-blue-500/15 text-blue-400',  dot: 'bg-blue-500'   },
    purple: { badge: 'bg-purple-500/15 text-purple-400',dot:'bg-purple-500'},
  }[r.color] || {};

  return (
    <div className="glass border border-white/7 rounded-xl p-4 flex gap-3 hover:border-white/12 transition-colors">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-slate-400 text-xs font-bold shrink-0">
        {i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-semibold text-slate-100">{r.action}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{r.priority}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{r.rationale}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{r.impact}</span>
        </div>
      </div>
    </div>
  );
};

// ── Health Score ──────────────────────────────────────────────────────────────
const HealthScore = () => (
  <div className="glass border border-emerald-500/15 rounded-2xl p-5 glow-green">
    <div className="flex items-center gap-2 mb-5">
      <CheckCircle2 size={16} className="text-emerald-400" />
      <h3 className="text-sm font-semibold text-slate-200">Financial Health Score</h3>
    </div>
    <div className="flex items-center gap-6">
      {/* Ring */}
      <div className="health-ring shrink-0">
        <div className="health-ring-inner">
          <span className="text-3xl font-black text-emerald-400">{healthScore.score}</span>
          <span className="text-[10px] text-slate-500">/100</span>
        </div>
      </div>
      {/* Breakdown */}
      <div className="flex-1 flex flex-col gap-2.5">
        <p className="text-base font-bold text-emerald-400">{healthScore.label}</p>
        {healthScore.breakdown.map((b) => (
          <div key={b.name} className="flex items-center gap-3">
            <p className="text-xs text-slate-400 w-36 shrink-0">{b.name}</p>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${b.score}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-slate-300 w-8 text-right">{b.score}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Forecast Chart ────────────────────────────────────────────────────────────
const ForecastChart = () => (
  <div className="glass border border-white/7 rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-4">
      <Zap size={16} className="text-amber-400" />
      <h3 className="text-sm font-semibold text-slate-200">Revenue Forecast (Linear Regression)</h3>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={forecastData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gFcast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={54} />
        <Tooltip
          formatter={(v) => [fmt(v)]}
          contentStyle={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#94A3B8' }}
          itemStyle={{ color: '#F1F5F9' }}
        />
        <ReferenceLine x="Dec" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" label={{ value: 'Forecast →', fill: '#64748B', fontSize: 10 }} />
        <Area type="monotone" dataKey="revenue"  stroke="#3B82F6" strokeWidth={2} fill="url(#gRev)"   dot={false} />
        <Area type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={2} fill="url(#gFcast)" dot={{ r: 4, fill: '#F59E0B' }} strokeDasharray="6 3" />
      </AreaChart>
    </ResponsiveContainer>
    <p className="text-xs text-slate-500 mt-2 text-center">Q1 projected revenue: $4.95M · Growth trend: +5.3%/mo</p>
  </div>
);

// ── Scenario Analysis ─────────────────────────────────────────────────────────
const ScenarioAnalysis = () => (
  <div className="glass border border-white/7 rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-4">
      <Target size={16} className="text-purple-400" />
      <h3 className="text-sm font-semibold text-slate-200">What-If Scenario Analysis</h3>
    </div>
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={scenarioData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="scenario" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={115} />
        <Tooltip
          formatter={(v) => [fmt(v), 'Net Profit']}
          contentStyle={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#94A3B8' }}
          itemStyle={{ color: '#F1F5F9' }}
        />
        <Bar dataKey="profit" radius={[0, 6, 6, 0]}>
          {scenarioData.map((d, i) => (
            <Cell key={i} fill={d.profit >= 4000000 ? '#10B981' : '#F43F5E'} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ── Forecast Page ─────────────────────────────────────────────────────────────
const Forecast = () => (
  <div className="flex flex-col gap-6 page-enter">
    {/* Header */}
    <div>
      <h2 className="text-2xl font-bold text-slate-100">Forecast Engine & AI Advisor</h2>
      <p className="text-slate-400 text-sm mt-0.5">Anomaly detection, smart recommendations, health score, and scenario planning.</p>
    </div>

    {/* Forecast + Health Score */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ForecastChart />
      <HealthScore />
    </div>

    {/* Anomaly Alerts */}
    <div>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-400" />
        <h3 className="text-sm font-semibold text-slate-200">AI-Detected Anomalies</h3>
        <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold">{anomalyAlerts.length} alerts</span>
      </div>
      <div className="flex flex-col gap-3 stagger">
        {anomalyAlerts.map((a) => <AlertCard key={a.id} a={a} />)}
      </div>
    </div>

    {/* Recommendations */}
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit size={16} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-slate-200">Decision Engine — Smart Recommendations</h3>
      </div>
      <div className="flex flex-col gap-3 stagger">
        {recommendations.map((r, i) => <RecCard key={r.id} r={r} i={i} />)}
      </div>
    </div>

    {/* Scenario */}
    <ScenarioAnalysis />
  </div>
);

export default Forecast;
