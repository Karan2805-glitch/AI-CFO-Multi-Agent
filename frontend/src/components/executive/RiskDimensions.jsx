import React from 'react';
import { Shield } from 'lucide-react';

const DIMENSION_LABELS = {
  profitability_risk:    'Profitability',
  volatility_risk:       'Volatility',
  cashflow_risk:         'Cashflow',
  operational_risk:      'Operational',
  forecast_risk:         'Forecast',
  growth_stability_risk: 'Growth',
};

const LEVEL_COLORS = {
  LOW:      { fill: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
  MEDIUM:   { fill: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  HIGH:     { fill: '#F43F5E', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.25)' },
  CRITICAL: { fill: '#FF1744', bg: 'rgba(255,23,68,0.12)',  border: 'rgba(255,23,68,0.30)' },
};

const LEVEL_NUMERIC = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

// ── SVG Hexagonal Radar ───────────────────────────────────
const SIZE = 240;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 90;
const RINGS = [0.25, 0.5, 0.75, 1.0];

function polarToXY(angle, radius) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function RadarChart({ dimensions }) {
  const entries = Object.entries(dimensions);
  if (entries.length === 0) return null;

  const angleStep = 360 / entries.length;

  // Ring guides
  const rings = RINGS.map(frac => {
    const r = MAX_R * frac;
    const pts = entries.map((_, i) => {
      const { x, y } = polarToXY(i * angleStep, r);
      return `${x},${y}`;
    }).join(' ');
    return <polygon key={frac} points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
  });

  // Axis lines
  const axes = entries.map((_, i) => {
    const { x, y } = polarToXY(i * angleStep, MAX_R);
    return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
  });

  // Data polygon
  const dataPoints = entries.map(([_, level], i) => {
    const val = (LEVEL_NUMERIC[level] || 1) / 4;
    const { x, y } = polarToXY(i * angleStep, MAX_R * val);
    return { x, y, level };
  });
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Determine dominant color
  const maxLevel = entries.reduce((max, [_, l]) => {
    return (LEVEL_NUMERIC[l] || 0) > (LEVEL_NUMERIC[max] || 0) ? l : max;
  }, 'LOW');
  const dominantColor = LEVEL_COLORS[maxLevel]?.fill || '#64748B';

  // Labels
  const labels = entries.map(([dim, level], i) => {
    const labelR = MAX_R + 28;
    const { x, y } = polarToXY(i * angleStep, labelR);
    const lCfg = LEVEL_COLORS[level] || LEVEL_COLORS.LOW;
    return (
      <g key={dim}>
        <text x={x} y={y - 5} fill="#94A3B8" fontSize="9" fontWeight="600"
          fontFamily="'Inter', system-ui, sans-serif" textAnchor="middle" dominantBaseline="middle">
          {DIMENSION_LABELS[dim] || dim}
        </text>
        <text x={x} y={y + 7} fill={lCfg.fill} fontSize="8" fontWeight="700"
          fontFamily="'Inter', system-ui, sans-serif" textAnchor="middle" dominantBaseline="middle">
          {level}
        </text>
      </g>
    );
  });

  // Data dots
  const dots = dataPoints.map((p, i) => {
    const lCfg = LEVEL_COLORS[p.level] || LEVEL_COLORS.LOW;
    return (
      <circle key={i} cx={p.x} cy={p.y} r="3.5"
        fill={lCfg.fill} stroke={lCfg.fill} strokeWidth="1"
        style={{ filter: `drop-shadow(0 0 4px ${lCfg.fill}60)` }}
      />
    );
  });

  return (
    <svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-full mx-auto">
      {rings}
      {axes}
      <polygon points={polyPoints}
        fill={`${dominantColor}12`}
        stroke={dominantColor}
        strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 6px ${dominantColor}30)`, transition: 'all 0.5s ease' }}
      />
      {dots}
      {labels}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────
export default function RiskDimensions({
  riskDimensions = {},
  riskLevel = 'UNKNOWN',
  dominantRiskFactor,
  riskSummary,
  riskConfidence,
}) {
  const entries = Object.entries(riskDimensions);
  const hasData = entries.length > 0;

  return (
    <div className="glass-executive p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <Shield size={17} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Risk Intelligence</h3>
            <p className="text-[11px] text-slate-500">6-dimensional risk analysis</p>
          </div>
        </div>
        {riskConfidence !== null && riskConfidence !== undefined && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
            {Math.round(riskConfidence * 100)}% confidence
          </span>
        )}
      </div>

      {hasData ? (
        <div className="flex flex-col gap-5">
          {/* Radar */}
          <RadarChart dimensions={riskDimensions} />

          {/* Summary */}
          {riskSummary && (
            <p className="text-[12px] text-slate-400 leading-relaxed text-center -mt-2 px-4">
              {riskSummary}
            </p>
          )}

          {/* Dimension list */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {entries.map(([dim, level]) => {
              const cfg = LEVEL_COLORS[level] || LEVEL_COLORS.LOW;
              const isDominant = dim === dominantRiskFactor;
              return (
                <div key={dim}
                  className="rounded-lg px-3 py-2 flex items-center justify-between"
                  style={{
                    background: isDominant ? cfg.bg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isDominant ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <span className="text-[11px] font-medium text-slate-300">
                    {DIMENSION_LABELS[dim] || dim}
                    {isDominant && <span className="text-[8px] text-slate-500 ml-1">★</span>}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: cfg.fill }}>{level}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <Shield size={24} className="text-slate-600" />
          <p className="text-sm text-slate-500">No risk data available.</p>
        </div>
      )}
    </div>
  );
}
