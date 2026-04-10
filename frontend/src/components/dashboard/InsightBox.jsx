import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

export default function InsightBox({ summary }) {
  const hasSummary = summary && typeof summary === 'string' && summary.trim().length > 0;

  return (
    <div
      className="relative rounded-2xl p-px overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(139,92,246,0.5) 50%, rgba(16,185,129,0.3) 100%)',
      }}
    >
      {/* Inner card */}
      <div
        className="relative rounded-2xl p-6 h-full"
        style={{
          background: 'rgba(8, 14, 28, 0.92)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Ambient blob */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)',
          }}
        />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))',
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 16px rgba(139,92,246,0.20)',
            }}
          >
            <Brain size={17} className="text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-100">AI Financial Auditor</p>
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.30)',
                  color: '#10B981',
                }}
              >
                <Sparkles size={9} />
                AI Generated
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Expert analysis of your financial health</p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px mb-4"
          style={{
            background: 'linear-gradient(90deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3), transparent)',
          }}
        />

        {/* Content */}
        {hasSummary ? (
          <div className="space-y-3">
            {/* Quote mark */}
            <div
              className="text-5xl leading-none font-serif select-none -mb-2"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              "
            </div>
            <p className="text-[14px] text-slate-200 leading-[1.8] font-light">
              {summary}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
            <Brain size={28} className="text-slate-600" />
            <p className="text-sm text-slate-500">No AI summary generated yet.</p>
            <p className="text-xs text-slate-600">Upload financial data to receive expert analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
