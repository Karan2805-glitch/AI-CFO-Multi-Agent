import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';

const RISK_CONFIG = {
  LOW: {
    label: 'Low Risk',
    icon: ShieldCheck,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.30)',
    glow: 'rgba(16,185,129,0.20)',
    dot: '#10B981',
  },
  MEDIUM: {
    label: 'Medium Risk',
    icon: ShieldAlert,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.30)',
    glow: 'rgba(245,158,11,0.20)',
    dot: '#F59E0B',
  },
  HIGH: {
    label: 'High Risk',
    icon: ShieldX,
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.30)',
    glow: 'rgba(244,63,94,0.25)',
    dot: '#F43F5E',
  },
  CRITICAL: {
    label: 'Critical Risk',
    icon: ShieldX,
    color: '#FF1744',
    bg: 'rgba(255,23,68,0.10)',
    border: 'rgba(255,23,68,0.35)',
    glow: 'rgba(255,23,68,0.30)',
    dot: '#FF1744',
  },
};

export default function RiskBadge({ level = 'UNKNOWN', size = 'md' }) {
  const normalized = String(level || 'UNKNOWN').toUpperCase();
  const config = RISK_CONFIG[normalized] || {
    label: normalized,
    icon: Shield,
    color: '#64748B',
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.25)',
    glow: 'rgba(100,116,139,0.15)',
    dot: '#64748B',
  };
  const Icon = config.icon;
  const isLg = size === 'lg';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold tracking-wide transition-all duration-300`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        boxShadow: `0 0 16px ${config.glow}`,
        padding: isLg ? '8px 16px' : '5px 12px',
        fontSize: isLg ? '13px' : '11px',
      }}
    >
      <Icon size={isLg ? 15 : 12} />
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: config.dot }}
      />
      {config.label}
    </span>
  );
}
