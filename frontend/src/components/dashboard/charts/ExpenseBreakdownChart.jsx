import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const COLORS = [
  '#3B82F6', // Blue
  '#F43F5E', // Rose/Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#64748B', // Slate
];

const toPieData = (expenseBreakdown) =>
  Object.entries(expenseBreakdown || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort largest to smallest

const fmt = (v) => {
  if (typeof v !== 'number') return 'N/A';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: 'rgba(7,11,20,0.96)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: p.payload.fill }} />
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">{p.name}</span>
        <span className="text-[13px] font-bold text-slate-100">{fmt(p.value)}</span>
      </div>
    </div>
  );
};

export default function ExpenseBreakdownChart({ expenseBreakdown }) {
  const data = toPieData(expenseBreakdown);
  const empty = data.length === 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(13,21,38,0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(139,92,246,0.15)',
        boxShadow: '0 4px 24px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)' }}
        >
          <PieChartIcon size={15} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100">Expense Breakdown</p>
          <p className="text-[11px] text-slate-500">Resource allocation profile</p>
        </div>
      </div>

      {/* Chart & Legend */}
      <div className="p-5 flex-1 flex flex-col md:flex-row items-center gap-6">
        {empty ? (
          <div className="w-full h-48 flex flex-col items-center justify-center gap-2 text-slate-500">
            <PieChartIcon size={28} className="text-slate-700" />
            <p className="text-sm">No expense data available.</p>
          </div>
        ) : (
          <>
            <div className="relative w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((item, index) => (
                      <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mb-0.5">Total</span>
                <span className="text-[14px] font-black text-slate-200">{fmt(total)}</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex-1 w-full flex flex-col gap-2.5 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
              {data.map((item, index) => {
                const color = COLORS[index % COLORS.length];
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-[12px] group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-slate-300 font-medium truncate group-hover:text-slate-100 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-400 font-semibold">{fmt(item.value)}</span>
                      <span className="w-9 text-right text-[10px] font-bold" style={{ color }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
