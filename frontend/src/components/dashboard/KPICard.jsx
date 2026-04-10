import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Activity, CreditCard } from 'lucide-react';

const formatValue = (value, currency = true, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  if (!currency) return `${value.toFixed(value % 1 !== 0 ? 1 : 0)}${suffix}`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
};

const CARD_THEMES = {
  revenue:  { icon: DollarSign,    accent: '#3B82F6', glow: 'rgba(59,130,246,0.15)',  bg: 'rgba(59,130,246,0.07)'  },
  expenses: { icon: CreditCard,    accent: '#F43F5E', glow: 'rgba(244,63,94,0.15)',   bg: 'rgba(244,63,94,0.07)'   },
  profit:   { icon: BarChart2,     accent: '#10B981', glow: 'rgba(16,185,129,0.15)',  bg: 'rgba(16,185,129,0.07)'  },
  margin:   { icon: Activity,      accent: '#8B5CF6', glow: 'rgba(139,92,246,0.15)',  bg: 'rgba(139,92,246,0.07)'  },
  health:   { icon: TrendingUp,    accent: '#10B981', glow: 'rgba(16,185,129,0.20)',  bg: 'rgba(16,185,129,0.08)'  },
  default:  { icon: DollarSign,    accent: '#64748B', glow: 'rgba(100,116,139,0.12)', bg: 'rgba(100,116,139,0.07)' },
};

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

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] group"
      style={{
        background: 'rgba(13,21,38,0.65)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.accent}30`,
        boxShadow: `0 4px 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Ambient gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: theme.accent, filter: 'blur(28px)' }}
      />

      {/* Icon + Label */}
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: theme.bg, border: `1px solid ${theme.accent}35` }}
        >
          <Icon size={15} style={{ color: theme.accent }} />
        </div>
        {trend !== null && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full`}
            style={{
              background: isPositiveTrend ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
              color: isPositiveTrend ? '#10B981' : '#F43F5E',
              border: `1px solid ${isPositiveTrend ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}
          >
            {isPositiveTrend ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendLabel}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5"
        >
          {label}
        </p>
        <p
          className="text-3xl font-black leading-none"
          style={{ color: theme.accent, textShadow: `0 0 20px ${theme.glow}` }}
        >
          {formatValue(value, currency, suffix)}
        </p>
        {subtitle && (
          <p className="mt-1.5 text-[11px] text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
