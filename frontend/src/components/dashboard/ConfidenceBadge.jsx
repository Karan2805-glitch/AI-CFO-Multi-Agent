import React from 'react';

const SIZE = 48;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 19;
const CIRCUMFERENCE = 2 * Math.PI * R;

const getColor = (value) => {
  if (value >= 0.8) return '#10B981';
  if (value >= 0.6) return '#3B82F6';
  if (value >= 0.4) return '#F59E0B';
  return '#F43F5E';
};

export default function ConfidenceBadge({ value, size = 'md', label = true }) {
  const safe = typeof value === 'number' && !Number.isNaN(value) ? Math.max(0, Math.min(1, value)) : 0;
  const pct = Math.round(safe * 100);
  const color = getColor(safe);
  const filled = CIRCUMFERENCE * safe;
  const isLg = size === 'lg';
  const scale = isLg ? 1.3 : 1;

  return (
    <div className="flex items-center gap-2">
      <div style={{ width: SIZE * scale, height: SIZE * scale }} className="relative">
        <svg width={SIZE * scale} height={SIZE * scale} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          {/* Fill */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
            strokeDashoffset={CIRCUMFERENCE * 0.25}
            style={{
              filter: `drop-shadow(0 0 4px ${color}80)`,
              transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold"
            style={{
              fontSize: isLg ? 14 : 11,
              color,
              textShadow: `0 0 8px ${color}40`,
            }}
          >
            {pct}%
          </span>
        </div>
      </div>
      {label && (
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Confidence</span>
          <span className="text-xs font-bold" style={{ color }}>
            {pct >= 80 ? 'High' : pct >= 60 ? 'Moderate' : pct >= 40 ? 'Low' : 'Weak'}
          </span>
        </div>
      )}
    </div>
  );
}
