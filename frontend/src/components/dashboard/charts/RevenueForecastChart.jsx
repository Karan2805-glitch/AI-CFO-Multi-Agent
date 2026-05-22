import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const fmt = (v) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return 'N/A';
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000_000) return `₹${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `₹${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `₹${(v / 1_000).toFixed(1)}k`;
  return `₹${v.toLocaleString()}`;
};

const buildData = (revenueTrend, forecast, expenseTrend) => {
  const hist = Array.isArray(revenueTrend) ? revenueTrend : [];
  const fore = Array.isArray(forecast)     ? forecast      : [];
  const exps = Array.isArray(expenseTrend) ? expenseTrend   : [];
  
  const data = [];
  let lastRevenue = null;

  hist.forEach((v, i) => {
    const revenueVal = typeof v === 'object' && v !== null ? v.revenue : v;
    const expenseVal = typeof exps[i] === 'object' && exps[i] !== null ? exps[i].expenses ?? exps[i].value : exps[i];
    const periodVal = typeof v === 'object' && v !== null && v.month ? v.month : `M${i + 1}`;
    lastRevenue = revenueVal;
    data.push({ 
      period: periodVal, 
      revenue: revenueVal, 
      expenses: expenseVal ?? 0,
      forecast: null 
    });
  });

  // Bridge point: connect historical to forecast
  if (lastRevenue !== null && fore.length > 0) {
    const firstForeVal = typeof fore[0] === 'object' && fore[0] !== null ? fore[0].revenue || fore[0].forecast : fore[0];
    data[data.length - 1].forecast = lastRevenue;
  }

  fore.forEach((v, i) => {
    const forecastVal = typeof v === 'object' && v !== null ? v.revenue || v.forecast : v;
    const periodVal = typeof v === 'object' && v !== null && v.month ? v.month : `F${i + 1}`;
    data.push({ 
      period: periodVal, 
      revenue: null, 
      expenses: null,
      forecast: forecastVal 
    });
  });
  return data;
};

const CustomTooltip = ({ active, payload, label }) => {
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
      <p className="text-slate-400 mb-2 font-semibold tracking-wider uppercase text-[10px]">{label}</p>
      {payload.map((p) => (
        p.value != null && (
          <div key={p.dataKey} className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="font-bold ml-auto" style={{ color: p.color }}>{fmt(p.value)}</span>
          </div>
        )
      ))}
    </div>
  );
};

export default function RevenueForecastChart({ revenueTrend, forecast, expenseTrend }) {
  const data = buildData(revenueTrend, forecast, expenseTrend);
  const splitIdx = Array.isArray(revenueTrend) ? revenueTrend.length : 0;
  const splitPeriod = splitIdx > 0 ? (data[splitIdx - 1]?.period) : null;

  const empty = data.length === 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13,21,38,0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.15)',
        boxShadow: '0 4px 24px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)' }}
          >
            <TrendingUp size={15} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Revenue &amp; Expense Projections</p>
            <p className="text-[11px] text-slate-500">Margin analysis + AI forecast</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Expenses
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Forecast
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-5">
        {empty ? (
          <div className="h-60 flex flex-col items-center justify-center gap-2 text-slate-500">
            <TrendingUp size={28} className="text-slate-700" />
            <p className="text-sm">No revenue data available.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />

              {splitPeriod && (
                <ReferenceLine
                  x={splitPeriod}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="4 4"
                  label={{ value: 'PROJECTION →', position: 'insideTopRight', fill: '#64748B', fontSize: 9, fontWeight: 700 }}
                />
              )}

              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#F43F5E"
                strokeWidth={2}
                fill="url(#expGrad)"
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="#F59E0B"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                fill="url(#fcastGrad)"
                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
