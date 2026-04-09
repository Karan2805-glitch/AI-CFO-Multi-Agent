import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  DollarSign, TrendingDown, BarChart2, Activity,
  TrendingUp, Clock, RefreshCw
} from 'lucide-react';
import { kpiData, trendData, normalizationData } from '../mockData';
import AIChatbot from '../components/AIChatbot';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) =>
  v >= 1000000
    ? `$${(v / 1000000).toFixed(1)}M`
    : v >= 1000
    ? `$${(v / 1000).toFixed(0)}k`
    : `$${v}`;

const iconMap = { DollarSign, TrendingDown, BarChart2, Activity };
const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   glow: 'glow-blue'   },
  red:    { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    glow: 'glow-red'    },
  green:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400',glow: 'glow-green'  },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'glow-purple' },
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ kpi, delay }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const Icon = iconMap[kpi.icon];
  const c    = colorMap[kpi.color];

  return (
    <div
      className={`glass ${c.glow} border ${c.border} p-5 rounded-2xl flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{kpi.label}</p>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon size={16} className={c.text} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-100">{kpi.formatted}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {kpi.deltaPositive
            ? <TrendingUp size={13} className="text-emerald-400" />
            : <TrendingDown size={13} className="text-red-400" />
          }
          <span className={`text-xs font-semibold ${kpi.deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {kpi.delta}
          </span>
          <span className="text-xs text-slate-500">{kpi.sub}</span>
        </div>
      </div>
    </div>
  );
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-slate-100">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Normalization Banner ──────────────────────────────────────────────────────
const NormBanner = () => (
  <div className="glass border border-blue-500/10 rounded-2xl p-5 flex flex-wrap gap-6">
    <div className="flex-1 min-w-48">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Normalization Layer</p>
      <p className="text-slate-300 text-sm">We don't use raw data — metrics are normalized to enable fair cross-company comparison.</p>
    </div>
    {[
      { label: 'Profit Margin',    val: `${(normalizationData.profit_margin * 100).toFixed(1)}%`,  sub: 'profit / revenue' },
      { label: 'Expense Ratio',    val: `${(normalizationData.expense_ratio * 100).toFixed(1)}%`,  sub: 'expenses / revenue' },
      { label: 'Salary Ratio',     val: `${(normalizationData.salary_ratio * 100).toFixed(1)}%`,   sub: 'salaries / revenue' },
      { label: 'Marketing Ratio',  val: `${(normalizationData.marketing_ratio * 100).toFixed(1)}%`,sub: 'marketing / revenue' },
    ].map((n) => (
      <div key={n.label} className="text-center">
        <p className="text-lg font-bold text-blue-400">{n.val}</p>
        <p className="text-xs text-slate-300 font-medium">{n.label}</p>
        <p className="text-[11px] text-slate-500 font-mono">{n.sub}</p>
      </div>
    ))}
  </div>
);

// ── Main Dashboard Page ───────────────────────────────────────────────────────
const Dashboard = () => (
  <div className="flex flex-col gap-6 page-enter">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Executive Dashboard</h2>
        <p className="text-slate-400 text-sm mt-0.5">Real-time overview of core financial performance.</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Clock size={13} />
        <span>Last updated: April 2024</span>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/8 text-slate-300">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {kpiData.map((k, i) => <KpiCard key={k.id} kpi={k} delay={i * 80} />)}
    </div>

    {/* Normalization Layer */}
    <NormBanner />

    {/* Bottom Section: Trend Chart + AI Chatbot */}
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

      {/* Trend Chart — takes 3/5 */}
      <div className="xl:col-span-3 glass border border-white/7 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Revenue vs Expenses — 12-Month Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">March anomaly highlighted — marketing spike exceeds 2σ</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ paddingTop: 12 }} />
            <ReferenceLine x="Mar" stroke="rgba(244,63,94,0.4)" strokeDasharray="4 2" label={{ value: '⚠ Anomaly', fill: '#F43F5E', fontSize: 10, position: 'top' }} />
            <Line type="monotone" dataKey="revenue"  name="Revenue"         stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="expenses" name="Total Expenses"  stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3, fill: '#F43F5E' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Chatbot — takes 2/5 */}
      <div className="xl:col-span-2">
        <AIChatbot />
      </div>

    </div>
  </div>
);

export default Dashboard;
