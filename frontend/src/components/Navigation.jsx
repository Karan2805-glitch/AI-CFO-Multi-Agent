import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, BrainCircuit, Activity,
  Upload, ChevronRight, Moon, Sparkles, LogOut, UserRound, Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clearDashboardState, fetchRuns, fetchResults } from '../api/analyzeService';
import { useData } from '../context/DataContext';

const navItems = [
  { to: '/upload',    icon: Upload,          label: 'Upload Data',     color: 'group-hover:text-sky-400',    active: 'text-sky-400',    ring: 'border-sky-500/30 bg-sky-500/10'    },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center',  color: 'group-hover:text-blue-400',  active: 'text-blue-400',   ring: 'border-blue-500/30 bg-blue-500/10'   },
  { to: '/ledger',    icon: Wallet,          label: 'Ledger Vault',    color: 'group-hover:text-purple-400', active: 'text-purple-400', ring: 'border-purple-500/30 bg-purple-500/10'},
  { to: '/forecast',  icon: BrainCircuit,    label: 'Forecast Engine', color: 'group-hover:text-emerald-400',active: 'text-emerald-400',ring: 'border-emerald-500/30 bg-emerald-500/10'},
];

const Navigation = ({ user, onLogout, onNewUpload }) => {
  const loc = useLocation();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isMidnight = theme === 'midnight';
  
  const { setDashboardState, setLoading, sessionId, runId } = useData();
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    const loadRuns = async () => {
      if (!sessionId) {
        setRuns([]);
        return;
      }

      try {
        const res = await fetchRuns(sessionId);
        setRuns(res.runs || []);
      } catch {
        setRuns([]);
      }
    };

    loadRuns();
  }, [sessionId, runId]);

  const handleRunClick = async (runId) => {
    setLoading(true);
    try {
      const res = await fetchResults(runId);
      const dashboardData = res.data ?? res;
      setDashboardState({
        sessionId: dashboardData.session_id || sessionId,
        runId: dashboardData.run_id,
        dashboardData
      });
      if (loc.pathname === '/upload') nav('/dashboard');
    } catch (error) { 
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-[#070B14]/90 backdrop-blur-2xl z-30 shrink-0 print-hide">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold grad-main">AI-CFO</p>
          <p className="text-[10px] text-slate-500 -mt-0.5">Intelligence Platform</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="px-3 py-5 flex flex-col gap-1">
        {navItems.map(({ to, icon, label, active, ring }) => {
          const isActive = loc.pathname === to || (to !== '/upload' && loc.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to === '/upload' ? '#' : to}
              onClick={(e) => {
                if (to === '/upload') {
                  e.preventDefault();
                  if (onNewUpload) onNewUpload();
                }
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? `${active} ${ring} border`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
              {React.createElement(icon, { size: 17, className: 'shrink-0' })}
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </NavLink>
          );
        })}
      </nav>

      {/* History Sidebar */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 hidden-scrollbar mt-2 border-t border-white/5 pt-4">
        <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          <Clock size={12} /> Run History
        </h4>
        <div className="flex flex-col gap-2">
          {runs.map((r, i) => (
            <button
              key={i}
              onClick={() => handleRunClick(r.run_id)}
              className="text-left px-3 py-2 rounded-lg bg-white/3 border border-white/5 hover:bg-white/10 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-300">Run #{r.run_id.split('_')[1]?.substring(0,4)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  r.health_score > 70 ? 'bg-emerald-500/20 text-emerald-400' : 
                  r.health_score > 40 ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>Health: {r.health_score}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'A moment ago'}
              </span>
            </button>
          ))}
          {runs.length === 0 && (
            <p className="text-xs text-slate-500">No recent runs</p>
          )}
        </div>
      </div>

      {/* ── Theme switcher */}
      <div className="px-4 pb-4">
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${isMidnight ? 'Void' : 'Midnight'} theme`}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 bg-white/3
            hover:bg-white/8 hover:border-white/15 transition-all duration-300 group"
        >
          <div className={`relative w-9 h-5 rounded-full transition-all duration-400 flex-shrink-0 ${
            isMidnight ? 'bg-blue-600/40' : 'bg-white/10'
          }`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-300 ${
              isMidnight ? 'left-0.5 bg-blue-400' : 'left-[18px] bg-slate-300'
            }`} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {isMidnight ? 'Midnight' : 'Void'}
            </p>
            <p className="text-[10px] text-slate-600">
              {isMidnight ? 'Navy blue' : 'Pure black'}
            </p>
          </div>
          {isMidnight ? <Sparkles size={13} className="text-blue-400 flex-shrink-0" /> : <Moon size={13} className="text-slate-400 flex-shrink-0" />}
        </button>
      </div>

      {/* User + Logout */}
      <div className="px-4 pb-5 border-t border-white/5 pt-4 print-hide">
        <div className="glass rounded-xl px-3 py-3 flex items-center gap-3">
          {user?.photo
            ? <img src={user.photo} alt="avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <UserRound size={13} className="text-white" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user?.name ?? 'Not signed in'}</p>
            <p className="text-[10px] text-slate-600 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={() => { if (onLogout) { clearDashboardState(); onLogout(); } }}
            title="Sign out"
            className="p-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-400 text-slate-500 transition-all duration-200"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navigation;

