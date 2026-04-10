import React from 'react';

const getHealthLabel = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#10B981', glow: 'rgba(16,185,129,0.35)' };
  if (score >= 60) return { label: 'Stable', color: '#3B82F6', glow: 'rgba(59,130,246,0.35)' };
  if (score >= 40) return { label: 'Moderate', color: '#F59E0B', glow: 'rgba(245,158,11,0.35)' };
  return { label: 'At Risk', color: '#F43F5E', glow: 'rgba(244,63,94,0.35)' };
};

export default function HealthScoreGauge({ score }) {
  const safeScore = typeof score === 'number' && !Number.isNaN(score) ? Math.max(0, Math.min(100, score)) : 0;
  const { label, color, glow } = getHealthLabel(safeScore);

  // SVG arc math
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 74;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * r;

  // Arc spans 270° (from 135° to 45° clockwise)
  const arcLength = circumference * 0.75;
  const filledLength = arcLength * (safeScore / 100);

  // Start at bottom-left (135°)
  const startAngle = 135;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const describeArc = (startDeg, lengthFraction) => {
    const totalAngle = 270 * lengthFraction;
    const endDeg = startDeg + totalAngle;
    const start = {
      x: cx + r * Math.cos(toRad(startDeg)),
      y: cy + r * Math.sin(toRad(startDeg)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg)),
      y: cy + r * Math.sin(toRad(endDeg)),
    };
    const largeArc = totalAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${glow}`,
            borderRadius: '50%',
          }}
        />

        <svg width={size} height={size} className="transform -rotate-0">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={describeArc(startAngle, 1)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {safeScore > 0 && (
            <path
              d={describeArc(startAngle, safeScore / 100)}
              fill="none"
              stroke={`url(#gaugeGrad)`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
                transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className="font-black leading-none"
            style={{ fontSize: 42, color, textShadow: `0 0 20px ${glow}` }}
          >
            {safeScore}
          </span>
          <span className="text-xs text-slate-500 font-semibold tracking-wider">/100</span>
        </div>
      </div>

      {/* Label */}
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}40`,
          color,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: color }}
        />
        {label}
      </div>
    </div>
  );
}
