import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, Loader2, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { analyzeCSV } from '../api/analyzeService';
import { useData } from '../context/DataContext';

const steps = [
  { label: 'Uploading file…',         pct: 17  },
  { label: 'Preprocessing data…',     pct: 33  },
  { label: 'Normalizing metrics…',    pct: 50  },
  { label: 'Running AI agents…',      pct: 70  },
  { label: 'Generating insights…',    pct: 90  },
  { label: 'Done! Loading dashboard…',pct: 100 },
];

const UploadPage = ({ onSuccess }) => {
  const [dragging, setDragging]     = useState(false);
  const [file, setFile]             = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stepIdx, setStepIdx]       = useState(-1);
  const [error, setError]           = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { setAnalysisData } = useData();

  const startPipeline = useCallback(async (f) => {
    setFile(f);
    setError(null);
    setProcessing(true);
    setStepIdx(0);

    try {
      // Real API call — drives setStepIdx as it progresses
      const data = await analyzeCSV(f, setStepIdx);

      // Store result globally (also saved to localStorage)
      setAnalysisData(data);

      // Brief pause on "Done" step then navigate
      setTimeout(() => {
        onSuccess();
        navigate('/dashboard');
      }, 600);

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Backend unavailable');
      setProcessing(false);
      setStepIdx(-1);
    }
  }, [navigate, onSuccess, setAnalysisData]);

  // Demo mode — uses mock data stored in localStorage if backend is down
  const startDemo = useCallback(() => {
    // Replicate demo data matching backend response shape
    const demoData = {
      kpi: {
        total_revenue: 12500000,
        total_expenses: 8500000,
        profit: 4000000,
        profit_margin: 32,
        avg_monthly_revenue: 1041667,
        expense_breakdown: {
          salaries: 3570000, marketing: 1700000, rent: 1275000,
          subscriptions: 850000, utilities: 425000, other: 680000,
        },
      },
      ratios: {
        expense_ratios: {
          salaries_ratio: 28.56, marketing_ratio: 13.6, rent_ratio: 10.2,
          subscriptions_ratio: 6.8, utilities_ratio: 3.4, other_ratio: 5.44,
        },
        total_expense_ratio: 68,
        profit_margin: 32,
      },
      risk: { risk_level: 'MEDIUM', risk_flags: ['Moderate profit margin'] },
      recommendations: {
        recommendations: [
          'Optimize marketing spend to improve return on investment',
          'Evaluate workforce efficiency and optimize salary expenses',
          'Financial health is stable. Maintain current strategy while exploring growth opportunities',
        ],
      },
      health_score: 78,
      auditor: {
        explanation: 'The company has a profit margin of 32%, with total expenses accounting for 68% of revenue. Based on these metrics, the system classified the financial risk as MEDIUM. Recommendations were generated to improve financial efficiency and reduce risk.',
      },
      forecast: {
        historical: [950000, 1050000, 1100000, 1020000, 1150000, 1250000, 1300000, 1350000, 1400000, 1380000, 1450000, 1500000],
        forecast: [1580000, 1645000, 1712000],
      },
      anomalies: ['Anomaly detected at row 2'],
    };

    setAnalysisData(demoData);
    let i = 0;
    setProcessing(true);
    setFile({ name: 'demo_financials.csv' });
    const tick = () => {
      setStepIdx(i);
      i += 1;
      if (i < steps.length) {
        setTimeout(tick, 500);
      } else {
        setTimeout(() => { onSuccess(); navigate('/dashboard'); }, 600);
      }
    };
    setTimeout(tick, 200);
  }, [navigate, onSuccess, setAnalysisData]);

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
                    <p className="text-xs text-slate-500 mt-1">Fix the CSV columns or try "Demo mode" to see the dashboard with sample data.</p>
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

              {/* Demo hint */}
              <button
                onClick={startDemo}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-slate-400
                  hover:text-slate-200 hover:bg-white/5 border border-white/5 transition-all group"
              >
                Try demo data
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
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
