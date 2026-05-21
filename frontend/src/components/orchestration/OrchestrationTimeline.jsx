import React from 'react';
import { Clock, Zap, GitBranch, Check } from 'lucide-react';

const STAGE_CONFIG = [
  { id: 'stage_1', label: 'Foundation',  color: '#64748B', agents: ['foundation'], parallel: false },
  { id: 'stage_2', label: 'Fan-Out',     color: '#3B82F6', agents: ['forecast_agent', 'anomaly_agent', 'health_agent'], parallel: true },
  { id: 'stage_3', label: 'Synthesis',   color: '#F59E0B', agents: ['risk_agent', 'recommendation_agent'], parallel: false },
  { id: 'stage_4', label: 'Executive',   color: '#8B5CF6', agents: ['auditor_agent'], parallel: false },
];

const agentLabel = (id) => {
  const map = {
    foundation: 'Data Pipeline',
    forecast_agent: 'Forecast',
    anomaly_agent: 'Anomaly',
    health_agent: 'Health',
    risk_agent: 'Risk',
    recommendation_agent: 'Recommend',
    auditor_agent: 'Auditor',
  };
  return map[id] || id;
};

export default function OrchestrationTimeline({
  completedAgents = [],
  failedAgents = [],
  pipelineStatus = 'COMPLETED',
}) {
  const isCompleted = (id) => completedAgents.includes(id);
  const isFailed = (id) => failedAgents.includes(id);

  const totalAgents = STAGE_CONFIG.reduce((sum, s) => sum + s.agents.length, 0);
  const completedCount = STAGE_CONFIG.reduce((sum, s) =>
    sum + s.agents.filter(a => isCompleted(a) && !isFailed(a)).length, 0);

  return (
    <div className="glass-executive p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Clock size={17} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Execution Timeline</h3>
            <p className="text-[11px] text-slate-500">Stage-level pipeline flow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            pipelineStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
            pipelineStatus === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
            pipelineStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
            'bg-blue-500/10 text-blue-400 border border-blue-500/25'
          }`}>
            {pipelineStatus}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        {STAGE_CONFIG.map((stage, si) => {
          const agentsCompleted = stage.agents.filter(a => isCompleted(a) && !isFailed(a)).length;
          const agentsFailed = stage.agents.filter(a => isFailed(a)).length;
          const allDone = agentsCompleted === stage.agents.length;
          const hasFails = agentsFailed > 0;

          return (
            <div key={stage.id} className="flex items-start gap-4">
              {/* Stage indicator */}
              <div className="flex flex-col items-center pt-1 w-8 shrink-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: allDone ? `${stage.color}20` : 'rgba(100,116,139,0.1)',
                    border: `1px solid ${allDone ? `${stage.color}50` : 'rgba(100,116,139,0.2)'}`,
                    color: allDone ? stage.color : '#64748B',
                  }}
                >
                  {allDone ? <Check size={11} /> : si + 1}
                </div>
                {si < STAGE_CONFIG.length - 1 && (
                  <div className="w-px h-8 mt-1" style={{
                    background: allDone ? `${stage.color}30` : 'rgba(100,116,139,0.1)',
                  }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-200">{stage.label}</span>
                  {stage.parallel && (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <GitBranch size={8} /> PARALLEL
                    </span>
                  )}
                  {allDone && !hasFails && (
                    <span className="text-[9px] font-bold text-emerald-400">✓ Complete</span>
                  )}
                  {hasFails && (
                    <span className="text-[9px] font-bold text-red-400">⚠ Partial</span>
                  )}
                </div>

                {/* Agent bars */}
                <div className={`flex ${stage.parallel ? 'flex-row' : 'flex-col'} gap-1.5`}>
                  {stage.agents.map((agentId) => {
                    const done = isCompleted(agentId) && !isFailed(agentId);
                    const failed = isFailed(agentId);
                    const barColor = failed ? '#F43F5E' : done ? stage.color : 'rgba(100,116,139,0.2)';

                    return (
                      <div key={agentId} className={`${stage.parallel ? 'flex-1' : 'w-full'}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">{agentLabel(agentId)}</span>
                          {done && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          <div
                            className="h-full rounded-full timeline-bar"
                            style={{
                              width: done || failed ? '100%' : '0%',
                              background: `linear-gradient(90deg, ${barColor}90, ${barColor})`,
                              boxShadow: done ? `0 0 8px ${barColor}40` : 'none',
                              animationDelay: `${si * 0.2 + 0.1}s`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Zap size={10} className="text-blue-400" />
          <span>
            {completedCount}/{totalAgents} agents completed
            {failedAgents.length > 0 && ` · ${failedAgents.length} failed`}
          </span>
        </div>
        <span className="text-[10px] text-slate-600">
          Fan-out stages execute concurrently via asyncio.gather
        </span>
      </div>
    </div>
  );
}
