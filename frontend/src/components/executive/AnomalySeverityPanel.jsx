import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#FF1744', bg: 'rgba(255,23,68,0.08)', border: 'rgba(255,23,68,0.20)', label: 'CRITICAL' },
  HIGH:     { color: '#F43F5E', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.20)', label: 'HIGH' },
  MEDIUM:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)', label: 'MEDIUM' },
  LOW:      { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)', label: 'LOW' },
  INFO:     { color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', label: 'INFO' },
};

const TYPE_ICONS = {
  'Revenue Collapse': '📉',
  'Revenue Spike': '📈',
  'Expense Surge': '💸',
  'Operational Cost Spike': '⚙️',
  'Profitability Deterioration': '📊',
  'Margin Compression': '🔻',
};

export default function AnomalySeverityPanel({
  anomaliesDetailed = [],
  anomalyCount = 0,
  anomalySummary,
  anomalyConfidence,
}) {
  const hasData = anomaliesDetailed.length > 0 || anomalyCount > 0;

  // Group by severity
  const bySeverity = {};
  anomaliesDetailed.forEach(a => {
    const sev = a.severity || 'LOW';
    if (!bySeverity[sev]) bySeverity[sev] = [];
    bySeverity[sev].push(a);
  });

  const orderedSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].filter(s => bySeverity[s]);

  return (
    <div className="glass-executive p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Zap size={17} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Anomaly Intelligence</h3>
            <p className="text-[11px] text-slate-500">Pattern deviation detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {anomalyCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {anomalyCount} detected
            </span>
          )}
          {anomalyConfidence !== null && anomalyConfidence !== undefined && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
              {Math.round(anomalyConfidence * 100)}% conf.
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {anomalySummary && (
        <p className="text-[12px] text-slate-400 leading-relaxed mb-4 pb-4 border-b border-white/5">
          {anomalySummary}
        </p>
      )}

      {hasData ? (
        <div className="space-y-4">
          {orderedSeverities.map(severity => {
            const items = bySeverity[severity];
            const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;

            return (
              <div key={severity}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                    {cfg.label} ({items.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((anomaly, i) => (
                    <div key={i}
                      className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <span className="text-sm mt-0.5 shrink-0">{TYPE_ICONS[anomaly.type] || '⚠️'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-slate-200">{anomaly.type || 'Anomaly'}</span>
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                            style={{ background: `${cfg.color}20`, color: cfg.color }}>
                            {severity}
                          </span>
                        </div>
                        {anomaly.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{anomaly.description}</p>
                        )}
                        {anomaly.column && (
                          <span className="text-[10px] text-slate-600 mt-0.5 block">Column: {anomaly.column}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <AlertTriangle size={24} className="text-slate-600" />
          <p className="text-sm text-slate-500">No anomalies detected.</p>
          <p className="text-xs text-slate-600">Financial patterns appear stable.</p>
        </div>
      )}
    </div>
  );
}
