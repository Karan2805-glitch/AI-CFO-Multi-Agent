import React from 'react';
import { Lightbulb, ArrowRight, AlertCircle } from 'lucide-react';

const PRIORITY_CONFIG = {
  high:     { color: '#F43F5E', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.25)', label: 'HIGH' },
  medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'MED'  },
  low:      { color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', label: 'LOW'  },
};

const getPriority = (text) => {
  if (!text) return 'low';
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('immediately') || lower.includes('urgent') || lower.includes('high')) return 'high';
  if (lower.includes('consider') || lower.includes('moderate') || lower.includes('review')) return 'medium';
  return 'low';
};

function RecommendationItem({ text, index }) {
  const priority = getPriority(text);
  const cfg = PRIORITY_CONFIG[priority];

  return (
    <div
      className="group relative flex items-start gap-4 rounded-xl p-4 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'rgba(13,21,38,0.55)',
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      {/* Number badge */}
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(139,92,246,0.20))',
          border: '1px solid rgba(139,92,246,0.25)',
          color: '#A78BFA',
        }}
      >
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-[13px] text-slate-200 font-medium leading-relaxed flex-1">
            {text}
          </p>
          <span
            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
            }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Arrow indicator visible on hover */}
      <ArrowRight
        size={14}
        className="shrink-0 mt-1 opacity-0 group-hover:opacity-40 transition-opacity duration-200 text-slate-400"
      />
    </div>
  );
}

export default function RecommendationList({ recommendations }) {
  const hasItems = Array.isArray(recommendations) && recommendations.length > 0;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13,21,38,0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(245,158,11,0.18)',
        boxShadow: '0 4px 24px rgba(245,158,11,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
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
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.30)',
            }}
          >
            <Lightbulb size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Action Plan</p>
            <p className="text-[11px] text-slate-500">AI-generated recommendations</p>
          </div>
        </div>
        {hasItems && (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#F59E0B',
            }}
          >
            {recommendations.length} actions
          </span>
        )}
      </div>

      {/* List */}
      <div className="p-4">
        {hasItems ? (
          <div className="flex flex-col gap-3">
            {recommendations.map((text, index) => (
              <RecommendationItem
                key={`rec-${index}`}
                text={typeof text === 'string' ? text : JSON.stringify(text)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <AlertCircle size={26} className="text-slate-600" />
            <p className="text-sm text-slate-500">No recommendations available yet.</p>
            <p className="text-xs text-slate-600">Upload financial data to generate your action plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
