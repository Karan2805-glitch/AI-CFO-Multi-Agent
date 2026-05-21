import React, { useState } from 'react';
import {
  Brain, Sparkles, Target, AlertTriangle, TrendingUp,
  Shield, ChevronDown, ChevronUp, Eye
} from 'lucide-react';

const UNCERTAINTY_CONFIG = {
  LOW:    { color: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'Low Uncertainty' },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'Moderate Uncertainty' },
  HIGH:   { color: '#F43F5E', bg: 'rgba(244,63,94,0.10)',  label: 'High Uncertainty' },
};

function OutlookCard({ horizon, text, icon: Icon, color }) {
  if (!text) return null;
  return (
    <div className="rounded-xl p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{horizon}</span>
      </div>
      <p className="text-[12px] text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = {
    CRITICAL: { color: '#FF1744', bg: 'rgba(255,23,68,0.12)' },
    HIGH: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    MEDIUM: { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
    LOW: { color: '#64748B', bg: 'rgba(100,116,139,0.10)' },
  }[priority] || { color: '#64748B', bg: 'rgba(100,116,139,0.10)' };
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {priority}
    </span>
  );
}

export default function ExecutiveSynthesis({
  auditorSummary,
  strategicOutlook,
  executivePriorities = [],
  uncertaintyLevel,
  uncertaintySummary,
  dominantRisks = [],
  conflictingSignals = [],
  auditorConfidence,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const hasSummary = auditorSummary && typeof auditorSummary === 'string' && auditorSummary.trim().length > 0;
  const ucfg = UNCERTAINTY_CONFIG[uncertaintyLevel] || UNCERTAINTY_CONFIG.LOW;

  return (
    <div className="glass-executive-accent p-6 relative overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-1"
        style={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #10B981)' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))', border: '1px solid rgba(139,92,246,0.35)', boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
            <Brain size={19} className="text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Executive Synthesis</h3>
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                <Sparkles size={8} /> AI Generated
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Multi-agent intelligence synthesis</p>
          </div>
        </div>
        {/* Confidence */}
        {auditorConfidence !== null && auditorConfidence !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Eye size={11} className="text-purple-400" />
            <span className="text-[11px] font-bold text-purple-300">{Math.round(auditorConfidence * 100)}% confidence</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-full h-px mb-5" style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25), transparent)' }} />

      {/* Executive Summary */}
      {hasSummary && (
        <div className="mb-6">
          <div className="text-4xl leading-none font-serif select-none -mb-1"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            "
          </div>
          <p className="text-[13.5px] text-slate-200 leading-[1.85] font-light">{auditorSummary}</p>
        </div>
      )}

      {/* Uncertainty + Dominant Risks row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Uncertainty */}
        {uncertaintyLevel && (
          <div className="rounded-xl p-4" style={{ background: ucfg.bg, border: `1px solid ${ucfg.color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} style={{ color: ucfg.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ucfg.color }}>
                {ucfg.label}
              </span>
            </div>
            {uncertaintySummary && (
              <p className="text-[12px] text-slate-300 leading-relaxed">{uncertaintySummary}</p>
            )}
          </div>
        )}

        {/* Dominant Risks */}
        {dominantRisks.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Dominant Risks</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dominantRisks.map((r, i) => (
                <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: r.severity === 'CRITICAL' ? 'rgba(255,23,68,0.15)' : 'rgba(244,63,94,0.12)',
                    color: r.severity === 'CRITICAL' ? '#FF1744' : '#F43F5E',
                    border: `1px solid ${r.severity === 'CRITICAL' ? 'rgba(255,23,68,0.3)' : 'rgba(244,63,94,0.25)'}`,
                  }}>
                  {r.dimension?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · {r.severity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Strategic Outlook */}
      {strategicOutlook && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Strategic Outlook</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <OutlookCard horizon="Short-Term" text={strategicOutlook.short_term} icon={TrendingUp} color="#3B82F6" />
            <OutlookCard horizon="Medium-Term" text={strategicOutlook.medium_term} icon={Target} color="#F59E0B" />
            <OutlookCard horizon="Long-Term" text={strategicOutlook.long_term} icon={Sparkles} color="#8B5CF6" />
          </div>
        </div>
      )}

      {/* Conflicting Signals */}
      {conflictingSignals.length > 0 && (
        <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Conflicting Signals</span>
          </div>
          <div className="flex flex-col gap-2">
            {conflictingSignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <p className="text-[12px] text-slate-300 leading-relaxed">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Priorities */}
      {executivePriorities.length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            <Target size={12} />
            Executive Priorities ({executivePriorities.length})
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {executivePriorities.map((ep, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-bold text-slate-200">{ep.title}</span>
                    <PriorityBadge priority={ep.priority} />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{ep.reason}</p>
                  {ep.recommended_focus && (
                    <p className="text-[11px] text-slate-500 mt-1.5 italic">→ {ep.recommended_focus}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
