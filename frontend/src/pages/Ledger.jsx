import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { PieChartIcon, BarChart2, AlertTriangle, Database, Activity } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';

const fmt = (v) => `$${(v / 1000000).toFixed(2)}M`;

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (!pct || parseFloat(pct) < 4) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
      {pct}%
    </text>
  );
};

const CustomTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: 'rgba(7,11,20,0.96)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: d.color || d.fill }} />
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">{d.name || d.company}</span>
        <span className="text-[13px] font-bold text-slate-100">
          {d.value !== undefined ? fmt(d.value) : `${d.profitMargin}%`}
          {d.pct !== undefined ? <span className="text-slate-500 font-normal ml-1">({d.pct}%)</span> : null}
        </span>
      </div>
    </div>
  );
};

const Ledger = () => {
  const { expenseData, benchmarkData, isReal } = useAnalysis();
  const topExpense = expenseData?.length > 0 ? [...expenseData].sort((a, b) => b.value - a.value)[0] : null;

  return (
    <div className="flex flex-col gap-8 pb-10 page-enter">
      {/* ── HEADER ────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Ledger Vault</h2>
          <p className="text-slate-400 text-sm mt-1">Resource allocation, burn rate, and peer benchmarking</p>
        </div>
        {isReal && (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
        )}
      </section>

      {/* ── ALERTS / HIGHLIGHTS ───────────────────────────────── */}
      {topExpense && (
        <section
          className="relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-red-500/40"
          style={{
            background: 'rgba(244, 63, 94, 0.05)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            boxShadow: '0 4px 24px rgba(244, 63, 94, 0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs text-red-300/80 uppercase tracking-widest font-bold mb-1">Highest Burn Category</p>
              <h3 className="text-xl font-bold text-slate-100">{topExpense.name}</h3>
              <p className="text-slate-400 text-sm mt-0.5">
                Consuming <span className="text-red-300 font-semibold">{topExpense.pct}%</span> of total operating costs at <span className="text-slate-200 font-medium">{fmt(topExpense.value)}</span>
              </p>
            </div>
            
            <div className="text-center md:text-right shrink-0">
              <p 
                className="text-4xl font-black"
                style={{ color: '#F43F5E', textShadow: '0 0 20px rgba(244,63,94,0.3)' }}
              >
                {topExpense.pct}<span className="text-xl opacity-70">%</span>
              </p>
              <div className="mt-2 h-1.5 w-32 rounded-full bg-red-500/10 border border-red-500/20 ml-auto">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${topExpense.pct}%` }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CHARTS ROW ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Doughnut */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(13,21,38,0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(139,92,246,0.15)',
            boxShadow: '0 4px 24px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <PieChartIcon size={15} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">Cost Distribution</p>
              <p className="text-[11px] text-slate-500">Resource allocation profile</p>
            </div>
          </div>
          <div className="p-5 flex-1 relative flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={105}
                  paddingAngle={3} dataKey="value"
                  stroke="none"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {expenseData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTip />} />
              </PieChart>
            </ResponsiveContainer>
             {/* Center Label Custom */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[10px]">
                <Activity size={24} className="text-slate-600 mb-1" />
             </div>
          </div>
        </div>

        {/* Benchmark comparison */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(13,21,38,0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 4px 24px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <BarChart2 size={15} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">Industry Benchmarks</p>
              <p className="text-[11px] text-slate-500">Peer comparison by profit margin</p>
            </div>
          </div>
          
          <div className="p-5 flex-1 flex flex-col">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={benchmarkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="company" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTip />} />
                <Bar dataKey="profitMargin" radius={[4, 4, 0, 0]}>
                  {benchmarkData.map((d, i) => (
                    <Cell key={i} fill={d.color || '#3B82F6'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Benchmark insights */}
            <div className="mt-5 flex flex-col gap-2 border-t border-white/5 pt-4">
              {[
                { text: 'TCS expense ratio (72%) is higher than Infosys (65%)', color: 'text-amber-400', bg:'bg-amber-500' },
                { text: 'Infosys most profitable at 35% — target benchmark', color: 'text-emerald-400', bg:'bg-emerald-500' },
                { text: 'Wipro salary ratio (32%) highest in peer group', color: 'text-red-400', bg:'bg-red-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.bg} opacity-80`} />
                  <p className={`text-[11px] font-medium ${item.color} opacity-90`}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPENSE TABLE ────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden glass"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Database size={15} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Detailed Accounting</h3>
              <p className="text-[11px] text-slate-500">Line item breakdown sorted by magnitude</p>
            </div>
          </div>
          {isReal && (
            <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Imported
            </span>
          )}
        </div>
        
        <div className="divide-y divide-white/5">
          {expenseData.map((e, index) => (
            <div 
              key={e.name} 
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-5 py-4 hover:bg-white-[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 sm:w-48 shrink-0">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                  style={{ background: `${e.color}15`, color: e.color, border: `1px solid ${e.color}30` }}
                >
                  {index + 1}
                </div>
                <p className="text-[13px] text-slate-200 font-semibold">{e.name}</p>
              </div>
              
              <div className="flex-1 max-w-sm w-full">
                <div className="flex justify-between text-[10px] mb-1.5 font-semibold text-slate-500">
                  <span>Usage Scale</span>
                  <span style={{ color: e.color }}>{e.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700" 
                    style={{ width: `${e.pct}%`, background: e.color, boxShadow: `0 0 10px ${e.color}` }} 
                  />
                </div>
              </div>
              
              <div className="sm:ml-auto flex items-center justify-end">
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Value</p>
                  <p className="text-sm text-slate-100 font-bold font-mono">{fmt(e.value)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Ledger;
