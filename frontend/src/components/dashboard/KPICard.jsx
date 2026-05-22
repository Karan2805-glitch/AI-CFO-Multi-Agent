import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, BarChart2, Activity, CreditCard, Sparkles } from 'lucide-react';

const formatValue = (value, currency = true, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  if (!currency) return `${value.toFixed(value % 1 !== 0 ? 1 : 0)}${suffix}`;
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `₹${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `₹${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `₹${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}k`;
  return `₹${value.toLocaleString()}`;
};

const CARD_THEMES = {
  revenue: {
    icon: IndianRupee,
    accent: '#3B82F6',
    glow: 'rgba(59,130,246,0.15)',
    bg: 'rgba(59,130,246,0.07)',
    emoji: '💰',
    insight: (v) => v > 50000 ? 'Strong revenue base' : v > 10000 ? 'Growing steadily' : 'Room to grow',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.06))',
  },
  expenses: {
    icon: CreditCard,
    accent: '#F43F5E',
    glow: 'rgba(244,63,94,0.15)',
    bg: 'rgba(244,63,94,0.07)',
    emoji: '📊',
    insight: (v) => v > 50000 ? 'High burn — review costs' : v > 10000 ? 'Moderate spending' : 'Well controlled',
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(251,113,133,0.04))',
  },
  profit: {
    icon: BarChart2,
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.15)',
    bg: 'rgba(16,185,129,0.07)',
    emoji: '✨',
    insight: (v) => v > 20000 ? 'Healthy profitability' : v > 0 ? 'Positive but slim' : 'Operating at a loss',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
  },
  margin: {
    icon: Activity,
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.15)',
    bg: 'rgba(139,92,246,0.07)',
    emoji: '📈',
    insight: (v) => v > 25 ? 'Strong margin position' : v > 10 ? 'Reasonable margin' : 'Thin margins — caution',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(168,85,247,0.05))',
  },
  health: {
    icon: TrendingUp,
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.20)',
    bg: 'rgba(16,185,129,0.08)',
    emoji: '💚',
    insight: (v) => v > 70 ? 'Business is thriving' : v > 40 ? 'Needs attention' : 'Critical condition',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
  },
  default: {
    icon: IndianRupee,
    accent: '#64748B',
    glow: 'rgba(100,116,139,0.12)',
    bg: 'rgba(100,116,139,0.07)',
    emoji: '📋',
    insight: () => '',
    gradient: 'linear-gradient(135deg, rgba(100,116,139,0.06), rgba(100,116,139,0.04))',
  },
};

// Mini sparkline — a tiny visual pulse bar
function MiniSparkline({ accent, positive }) {
  const heights = positive
    ? [40, 55, 45, 60, 50, 70, 65, 80, 75, 85]
    : [80, 70, 75, 60, 65, 50, 55, 40, 45, 35];
  return (
    <div className="flex items-end gap-[2px] h-6 opacity-50 group-hover:opacity-80 transition-opacity duration-500">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h}%`,
            background: accent,
            opacity: 0.3 + (i / heights.length) * 0.7,
            transition: `height 0.3s ease ${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default function KPICard({
  label,
  value,
  subtitle,
  themeKey = 'default',
  currency = true,
  suffix = '',
  trend = null,
  trendLabel = '',
}) {
  const theme = CARD_THEMES[themeKey] || CARD_THEMES.default;
  const Icon = theme.icon;
  const isPositiveTrend = trend === null ? null : trend >= 0;
  const insightText = theme.insight(value ?? 0);
  const numericValue = typeof value === 'number' ? value : 0;

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col justify-between gap-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group cursor-default"
      style={{
        background: theme.gradient,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.accent}20`,
        boxShadow: `0 4px 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }}
      />

      {/* Ambient gradient blob */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{ background: theme.accent, filter: 'blur(32px)' }}
      />

      {/* Row 1: Icon + Trend + Sparkline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: theme.bg, border: `1px solid ${theme.accent}30` }}
          >
            <Icon size={16} style={{ color: theme.accent }} />
          </div>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold leading-tight">
            {label}
          </p>
        </div>
        <MiniSparkline accent={theme.accent} positive={isPositiveTrend !== false} />
      </div>

      {/* Row 2: Big Value */}
      <div>
        <p
          className="text-[28px] font-black leading-none tracking-tight"
          style={{ color: theme.accent, textShadow: `0 0 24px ${theme.glow}` }}
        >
          {formatValue(value, currency, suffix)}
        </p>
      </div>

      {/* Row 3: Insight + Trend badge */}
      <div className="flex items-center justify-between gap-2">
        {/* Human insight */}
        <p className="text-[10.5px] text-slate-500 font-medium leading-snug flex items-center gap-1.5">
          <Sparkles size={9} className="text-slate-600 shrink-0" />
          {insightText}
        </p>

        {/* Trend badge */}
        {trend !== null && (
          <div
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: isPositiveTrend ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
              color: isPositiveTrend ? '#10B981' : '#F43F5E',
              border: `1px solid ${isPositiveTrend ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
            }}
          >
            {isPositiveTrend ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trendLabel}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[10px] text-slate-600 -mt-1">{subtitle}</p>
      )}
    </div>
  );
}
