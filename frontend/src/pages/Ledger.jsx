import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { expenseData, benchmarkData } from '../mockData';
import { PieChartIcon, BarChart2, AlertTriangle } from 'lucide-react';

const fmt = (v) => `$${(v / 1000000).toFixed(2)}M`;

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, pct }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {pct}%
    </text>
  );
};

const CustomTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D1526] border border-white/10 rounded-xl p-3 text-xs shadow-2xl">
      <p className="font-semibold text-slate-200 mb-1">{d.name}</p>
      <p className="text-slate-400">{fmt(d.value)} <span className="text-slate-500">({d.pct}%)</span></p>
    </div>
  );
};

const Ledger = () => {
  const topExpense = [...expenseData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="flex flex-col gap-6 page-enter">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Ledger Vault</h2>
        <p className="text-slate-400 text-sm mt-0.5">Category-level expense breakdown and peer benchmarking.</p>
      </div>

      {/* Top expense highlight */}
      <div className="glass border border-red-500/15 rounded-2xl p-5 flex items-center gap-5 glow-red">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Highest Expense Category</p>
          <p className="text-slate-100 font-bold text-lg mt-0.5">{topExpense.name}</p>
          <p className="text-slate-400 text-sm">{topExpense.pct}% of total operating cost · {fmt(topExpense.value)}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-red-400">{topExpense.pct}<span className="text-lg">%</span></p>
          <div className="mt-1 h-1.5 w-24 rounded-full bg-white/5 ml-auto">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${topExpense.pct}%` }} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut */}
        <div className="glass border border-white/7 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={16} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Expense Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {expenseData.map((e, i) => (
                  <Cell key={i} fill={e.color} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip content={<CustomTip />} />
              <Legend
                formatter={(val) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark comparison */}
        <div className="glass border border-white/7 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Peer Benchmark — Profit Margin (%)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={benchmarkData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="company" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Profit Margin']}
                contentStyle={{ background: '#0D1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#94A3B8' }}
                itemStyle={{ color: '#F1F5F9' }}
              />
              <Bar dataKey="profitMargin" name="Profit Margin" radius={[6, 6, 0, 0]}>
                {benchmarkData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Benchmark insights */}
          <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4">
            {[
              { text: 'TCS expense ratio (72%) is higher than Infosys (65%)', color: 'text-amber-400' },
              { text: 'Infosys most profitable at 35% — your target benchmark', color: 'text-emerald-400' },
              { text: 'Wipro salary ratio (32%) highest in peer group', color: 'text-red-400' },
            ].map((i, idx) => (
              <p key={idx} className={`text-xs ${i.color}`}>• {i.text}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="glass border border-white/7 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">Detailed Expense Categories</h3>
        </div>
        <div className="divide-y divide-white/5">
          {expenseData.map((e) => (
            <div key={e.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: e.color }} />
              <p className="text-sm text-slate-200 flex-1 font-medium">{e.name}</p>
              <div className="flex-1 max-w-xs">
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${e.pct}%`, background: e.color }} />
                </div>
              </div>
              <p className="text-sm text-slate-300 font-semibold w-16 text-right">{e.pct}%</p>
              <p className="text-sm text-slate-400 w-20 text-right">{fmt(e.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ledger;
