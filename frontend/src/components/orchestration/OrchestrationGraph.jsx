import React, { useMemo } from 'react';
import {
  Database, TrendingUp, AlertTriangle, Heart,
  Shield, Lightbulb, Brain, Check, X, Loader2, Zap
} from 'lucide-react';

const ICON_MAP = {
  Database, TrendingUp, AlertTriangle, Heart,
  Shield, Lightbulb, Brain,
};

const STATUS_COLORS = {
  completed: { fill: 'rgba(16,185,129,0.10)', stroke: '#10B981', text: '#10B981', glow: 'rgba(16,185,129,0.3)' },
  running:   { fill: 'rgba(59,130,246,0.12)', stroke: '#3B82F6', text: '#3B82F6', glow: 'rgba(59,130,246,0.4)' },
  failed:    { fill: 'rgba(244,63,94,0.10)',  stroke: '#F43F5E', text: '#F43F5E', glow: 'rgba(244,63,94,0.3)' },
  idle:      { fill: 'rgba(100,116,139,0.06)', stroke: 'rgba(100,116,139,0.25)', text: '#64748B', glow: 'transparent' },
};

const STAGE_LABELS = ['Foundation', 'Fan-Out Intelligence', 'Synthesis', 'Executive'];
const STAGE_COLORS = ['#64748B', '#3B82F6', '#F59E0B', '#8B5CF6'];

// ── Layout constants ───────────────────────────────────────
const SVG_W = 700;
const SVG_H = 440;
const NODE_W = 130;
const NODE_H = 48;
const NODE_RX = 12;
const CX = SVG_W / 2; // center X

// Row Y positions (tighter spacing)
const ROW_Y = [50, 150, 260, 360];
// Fan-out columns (3 nodes evenly spaced)
const FAN_SPREAD = 165;
const FAN_COL = [CX - FAN_SPREAD, CX, CX + FAN_SPREAD];
// Synthesis columns (2 side by side)
const SYN_SPREAD = 85;
const SYN_COL = [CX - SYN_SPREAD, CX + SYN_SPREAD];

function getNodePositions(nodes) {
  const pos = {};
  // Stage 0 — Foundation (centered)
  pos['foundation'] = { x: CX - NODE_W / 2, y: ROW_Y[0] };
  // Stage 1 — Fan-out (3 side by side)
  const fanoutNodes = nodes.filter(n => n.stage === 1);
  fanoutNodes.forEach((n, i) => {
    pos[n.id] = { x: FAN_COL[i] - NODE_W / 2, y: ROW_Y[1] };
  });
  // Stage 2 — Synthesis (2 side by side)
  pos['risk_agent'] = { x: SYN_COL[0] - NODE_W / 2, y: ROW_Y[2] };
  pos['recommendation_agent'] = { x: SYN_COL[1] - NODE_W / 2, y: ROW_Y[2] };
  // Stage 3 — Executive (centered)
  pos['auditor_agent'] = { x: CX - NODE_W / 2, y: ROW_Y[3] };
  return pos;
}

function getNodeStatus(nodeId, completedAgents, failedAgents, pipelineStatus) {
  if (nodeId === 'foundation') {
    if (pipelineStatus === 'COMPLETED' || pipelineStatus === 'PARTIAL') return 'completed';
    if (pipelineStatus === 'RUNNING') return 'completed';
    if (pipelineStatus === 'FAILED') return 'failed';
    return 'idle';
  }
  if (failedAgents.includes(nodeId)) return 'failed';
  if (completedAgents.includes(nodeId)) return 'completed';
  if (pipelineStatus === 'RUNNING') return 'idle';
  if (pipelineStatus === 'COMPLETED' || pipelineStatus === 'PARTIAL') {
    if (!failedAgents.includes(nodeId)) return 'completed';
  }
  return 'idle';
}

// ── SVG Node ──────────────────────────────────────────────
function GraphNode({ id, label, icon, x, y, status }) {
  const IconComp = ICON_MAP[icon] || Database;
  const s = STATUS_COLORS[status] || STATUS_COLORS.idle;
  const StatusIcon = status === 'completed' ? Check : status === 'failed' ? X : status === 'running' ? Loader2 : null;

  return (
    <g transform={`translate(${x},${y})`} className={`node-${status}`}>
      {/* Glow ring */}
      {status !== 'idle' && (
        <rect x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx={NODE_RX + 3}
          fill="none" stroke={s.stroke} strokeWidth="1" opacity="0.2"
          style={status === 'running' ? { animation: 'node-ring-pulse 2s ease-in-out infinite' } : undefined}
        />
      )}
      {/* Body */}
      <rect className="node-body" width={NODE_W} height={NODE_H} rx={NODE_RX}
        fill={s.fill} stroke={s.stroke} strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 10px ${s.glow})`, transition: 'all 0.5s ease' }}
      />
      {/* Icon */}
      <foreignObject x={12} y={(NODE_H - 20) / 2} width={20} height={20}>
        <IconComp size={16} color={s.text} style={{ opacity: 0.9 }} />
      </foreignObject>
      {/* Label */}
      <text x={38} y={NODE_H / 2 + 1} fill={s.text} fontSize="11.5" fontWeight="600"
        fontFamily="'Inter', system-ui, sans-serif" dominantBaseline="middle">
        {label}
      </text>
      {/* Status icon */}
      {StatusIcon && (
        <foreignObject x={NODE_W - 26} y={(NODE_H - 16) / 2} width={16} height={16}>
          <StatusIcon size={13} color={s.text}
            style={status === 'running' ? { animation: 'spin 1s linear infinite' } : undefined}
          />
        </foreignObject>
      )}
    </g>
  );
}

// ── SVG Edge ──────────────────────────────────────────────
function GraphEdge({ x1, y1, x2, y2, status }) {
  const dy = y2 - y1;
  const cpOffset = Math.min(Math.abs(dy) * 0.45, 40);
  const d = `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
  const strokeColor = status === 'completed' ? 'rgba(16,185,129,0.35)'
    : status === 'running' ? 'rgba(59,130,246,0.5)'
    : 'rgba(100,116,139,0.12)';
  const edgeClass = status === 'completed' ? 'edge-completed' : status === 'running' ? 'edge-active' : 'edge-idle';

  return (
    <g>
      <path d={d} fill="none" stroke={strokeColor} strokeWidth="1.5" className={edgeClass} />
      {status === 'completed' && (
        <circle r="2" fill="#10B981" opacity="0.7">
          <animateMotion dur="2.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

// ── Stage label (left-aligned row label) ──────────────────
function StageLabel({ y, label, color, index }) {
  return (
    <g>
      {/* Subtle horizontal guide */}
      <line x1={0} y1={y + NODE_H / 2} x2={SVG_W} y2={y + NODE_H / 2}
        stroke="rgba(255,255,255,0.02)" strokeWidth="1"
      />
      {/* Numbered badge + label */}
      <rect x={6} y={y + NODE_H / 2 - 9} width={16} height={18} rx={4}
        fill={color} opacity="0.15"
      />
      <text x={14} y={y + NODE_H / 2 + 1} fill={color} fontSize="9" fontWeight="800"
        fontFamily="'Inter', system-ui, sans-serif" textAnchor="middle" dominantBaseline="middle">
        {index + 1}
      </text>
      <text x={28} y={y + NODE_H / 2 + 1} fill={color} fontSize="9" fontWeight="600"
        fontFamily="'Inter', system-ui, sans-serif" dominantBaseline="middle"
        opacity="0.5" letterSpacing="0.06em">
        {label}
      </text>
    </g>
  );
}

// ── Main Component ────────────────────────────────────────
export default function OrchestrationGraph({
  executionGraph,
  completedAgents = [],
  failedAgents = [],
  pipelineStatus = 'COMPLETED',
}) {
  const { nodes, edges } = executionGraph;
  const positions = useMemo(() => getNodePositions(nodes), [nodes]);

  const edgesWithStatus = edges.map(e => {
    const fromStatus = getNodeStatus(e.from, completedAgents, failedAgents, pipelineStatus);
    const toStatus = getNodeStatus(e.to, completedAgents, failedAgents, pipelineStatus);
    let status = 'idle';
    if (fromStatus === 'completed' && toStatus === 'completed') status = 'completed';
    else if (fromStatus === 'completed' && toStatus === 'running') status = 'running';
    else if (fromStatus === 'completed') status = 'completed';
    return { ...e, status };
  });

  const completedCount = nodes.filter(n => getNodeStatus(n.id, completedAgents, failedAgents, pipelineStatus) === 'completed').length;
  const totalNodes = nodes.length;

  return (
    <div className="glass-executive p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Zap size={17} className="text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Orchestration Pipeline</h3>
            <p className="text-[11px] text-slate-500">Multi-agent execution graph</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
            {completedCount}/{totalNodes} nodes
          </span>
          <div className="flex items-center gap-3">
            {[
              { label: 'Completed', color: '#10B981' },
              { label: 'Running', color: '#3B82F6' },
              { label: 'Failed', color: '#F43F5E' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-slate-500 font-medium">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="flex justify-center">
        <svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="max-w-full" style={{ overflow: 'visible' }}>

          {/* Stage labels (left side) */}
          {STAGE_LABELS.map((label, i) => (
            <StageLabel key={i} y={ROW_Y[i]} label={label} color={STAGE_COLORS[i]} index={i} />
          ))}

          {/* Edges (behind nodes) */}
          {edgesWithStatus.map((e, i) => {
            const from = positions[e.from];
            const to = positions[e.to];
            if (!from || !to) return null;
            return (
              <GraphEdge key={i}
                x1={from.x + NODE_W / 2} y1={from.y + NODE_H}
                x2={to.x + NODE_W / 2} y2={to.y}
                status={e.status}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const p = positions[node.id];
            if (!p) return null;
            const status = getNodeStatus(node.id, completedAgents, failedAgents, pipelineStatus);
            return (
              <GraphNode key={node.id}
                id={node.id}
                label={node.label}
                icon={node.icon}
                x={p.x} y={p.y}
                status={status}
              />
            );
          })}

          {/* Parallel execution label */}
          <text x={CX} y={ROW_Y[1] - 8} fill="rgba(59,130,246,0.35)" fontSize="8.5"
            fontWeight="700" textAnchor="middle" fontFamily="'Inter', system-ui, sans-serif"
            letterSpacing="0.14em">
            PARALLEL EXECUTION
          </text>
        </svg>
      </div>
    </div>
  );
}
