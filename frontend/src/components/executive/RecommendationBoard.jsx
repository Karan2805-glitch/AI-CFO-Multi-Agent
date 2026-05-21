import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, ArrowRight, Clock, Target } from 'lucide-react';

const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const PRIORITY_CONFIG = {
  CRITICAL: { color: '#FF1744', bg: 'rgba(255,23,68,0.08)', border: 'rgba(255,23,68,0.20)', glow: 'rgba(255,23,68,0.12)', label: 'CRITICAL', cssClass: 'priority-critical' },
  HIGH:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)', glow: 'rgba(245,158,11,0.10)', label: 'HIGH',     cssClass: 'priority-high'     },
  MEDIUM:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.18)', glow: 'rgba(59,130,246,0.08)', label: 'MEDIUM',   cssClass: 'priority-medium'   },
  LOW:      { color: '#64748B', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.15)', glow: 'rgba(100,116,139,0.06)', label: 'LOW',    cssClass: 'priority-low'      },
};

const HORIZON_LABELS = {
  IMMEDIATE:   'Immediate',
  SHORT_TERM:  'Short-Term',
  MEDIUM_TERM: 'Medium-Term',
  LONG_TERM:   'Long-Term',
};

function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.LOW;

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-300 hover:scale-[1.005] cursor-pointer ${cfg.cssClass}`}
      onClick={() => setExpanded(!expanded)}
      style={{
        background: 'rgba(13,21,38,0.5)',
        border: `1px solid rgba(255,255,255,0.05)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-200 leading-tight">{rec.title}</p>
            <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">{rec.recommendation}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          {expanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
          {/* Reasoning */}
          <div className="flex items-start gap-2">
            <ArrowRight size={11} className="text-slate-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reasoning</span>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{rec.reasoning}</p>
            </div>
          </div>
          {/* Expected outcome */}
          {rec.expected_outcome && (
            <div className="flex items-start gap-2">
              <Target size={11} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Expected Outcome</span>
                <p className="text-[11px] text-emerald-300 leading-relaxed mt-0.5">{rec.expected_outcome}</p>
              </div>
            </div>
          )}
          {/* Metadata */}
          <div className="flex items-center gap-3 pt-1">
            {rec.impact_area && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/4 text-slate-400 border border-white/6">
                {rec.impact_area}
              </span>
            )}
            {rec.time_horizon && (
              <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
                <Clock size={9} />
                {HORIZON_LABELS[rec.time_horizon] || rec.time_horizon}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationBoard({ recommendationsDetailed = [] }) {
  // Group by priority
  const grouped = {};
  PRIORITY_ORDER.forEach(p => { grouped[p] = []; });
  recommendationsDetailed.forEach(rec => {
    const p = PRIORITY_ORDER.includes(rec.priority) ? rec.priority : 'LOW';
    grouped[p].push(rec);
  });

  const totalCount = recommendationsDetailed.length;
  const criticalHighCount = (grouped.CRITICAL?.length || 0) + (grouped.HIGH?.length || 0);

  return (
    <div className="glass-executive p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)' }}>
            <Lightbulb size={17} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recommendation Priority Board</h3>
            <p className="text-[11px] text-slate-500">Strategic actions ranked by impact</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalHighCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              {criticalHighCount} urgent
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
            {totalCount} actions
          </span>
        </div>
      </div>

      {/* Priority groups */}
      <div className="space-y-5">
        {PRIORITY_ORDER.map(priority => {
          const items = grouped[priority];
          if (!items || items.length === 0) return null;
          const cfg = PRIORITY_CONFIG[priority];

          return (
            <div key={priority}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label} Priority
                </span>
                <span className="text-[10px] text-slate-600">({items.length})</span>
                <div className="flex-1 h-px ml-2" style={{ background: `${cfg.color}15` }} />
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {items.map((rec, i) => (
                  <RecommendationCard key={`${priority}-${i}`} rec={rec} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <Lightbulb size={24} className="text-slate-600" />
          <p className="text-sm text-slate-500">No recommendations generated yet.</p>
          <p className="text-xs text-slate-600">Upload financial data to generate strategic actions.</p>
        </div>
      )}
    </div>
  );
}
