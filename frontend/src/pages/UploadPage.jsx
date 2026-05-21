import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { runDashboardFlow } from '../api/analyzeService';
import { useData } from '../context/DataContext';
import { loadAuth } from '../lib/auth';

const steps = [
  { label: 'Starting session...', pct: 25 },
  { label: 'Running analysis...', pct: 55 },
  { label: 'Fetching results...', pct: 85 },
  { label: 'Done! Loading dashboard...', pct: 100 },
];

const UploadPage = ({ onSuccess }) => {
  const [dragging, setDragging]     = useState(false);
  const [file, setFile]             = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stepIdx, setStepIdx]       = useState(-1);
  const [error, setLocalError]      = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setDashboardState, setLoading, setError } = useData();

  const startPipeline = useCallback(async (f) => {
    setFile(f);
    setLocalError(null);
    setError(null);
    setProcessing(true);
    setStepIdx(0);
    setLoading(true);

    try {
      const currentUser = loadAuth().user;
      if (!currentUser) {
        throw new Error('You must be signed in to upload files');
      }
      const dashboardState = await runDashboardFlow({
        file: f,
        sessionPayload: {
          username: currentUser.name || currentUser.email,
          company: currentUser?.profile?.orgName || currentUser?.company || '',
          industry: currentUser?.profile?.industry || currentUser?.industry || '',
        },
        onStep: setStepIdx,
      });
      setDashboardState(dashboardState);

      // Brief pause on "Done" step then navigate
      setTimeout(() => {
        setLoading(false);
        onSuccess();
        navigate('/dashboard');
      }, 600);

    } catch (err) {
      console.error('Analysis failed:', err);
      const message = err.message || 'Backend unavailable';
      setLocalError(message);
      setError(message);
      setProcessing(false);
      setStepIdx(-1);
      setLoading(false);
    }
  }, [navigate, onSuccess, setDashboardState, setLoading, setError]);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) startPipeline(f);
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <Zap size={12} />
            Multi-Agent Financial Intelligence
          </div>
          <h1 className="text-4xl font-extrabold grad-main mb-2 tracking-tight">AI-CFO Platform</h1>
          <p className="text-slate-400 text-sm">Upload your financial CSV to activate the analysis pipeline.</p>
        </div>

        {/* Card */}
        <div className="glass glow-blue p-6 rounded-2xl animate-slide-up">
          {!processing ? (
            <>
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Upload error</p>
                    <p className="text-xs text-red-400/80 mt-0.5 whitespace-pre-wrap">{error}</p>
                    <p className="text-xs text-slate-500 mt-1">Please verify CSV format and backend availability, then retry.</p>
                  </div>
                </div>
              )}

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                  ${dragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/3 hover:border-blue-500/50 hover:bg-blue-500/5'
                  }`}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <UploadCloud
                  size={44}
                  className={`mx-auto mb-3 transition-colors ${dragging ? 'text-blue-400' : 'text-slate-500'}`}
                />
                <p className="text-slate-200 font-semibold mb-1">Drop your CSV file here</p>
                <p className="text-slate-500 text-sm mb-2">Columns: months, revenue, rent, salaries, marketing,<br />subscriptions, utilities, other &nbsp;<span className="text-slate-600">(or use <code className="text-blue-400/70">date</code> instead of <code className="text-blue-400/70">months</code>)</span></p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
                  <FileText size={15} /> Select File
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { if (e.target.files[0]) startPipeline(e.target.files[0]); }}
                />
              </div>

            </>
          ) : (
            /* Processing state */
            <div className="py-4">
              {/* File name */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 mb-6">
                <FileText size={18} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{file?.name}</p>
                  <p className="text-xs text-slate-500">Financial data</p>
                </div>
                <Loader2 size={16} className="text-blue-400 animate-spin shrink-0" />
              </div>

              {/* Steps */}
              <div className="flex flex-col gap-2.5 mb-6">
                {steps.map((s, i) => {
                  const done    = i < stepIdx;
                  const current = i === stepIdx;
                  return (
                    <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${i > stepIdx + 1 ? 'opacity-25' : 'opacity-100'}`}>
                      {done
                        ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        : current
                          ? <Loader2 size={16} className="text-blue-400 animate-spin shrink-0" />
                          : <div className="w-4 h-4 rounded-full border border-white/15 shrink-0" />
                      }
                      <span className={`text-sm ${done ? 'text-emerald-400' : current ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${steps[Math.max(0, stepIdx)]?.pct ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
