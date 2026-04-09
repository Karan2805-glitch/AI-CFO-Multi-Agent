import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, UserRound, Mail, Lock, Eye, EyeOff,
  ArrowRight, ShieldCheck, TrendingUp, Brain, UserPlus, X
} from 'lucide-react';
import CurvedLoop from '../components/CurvedLoop';
import { registerUser, loginUser, handleGoogleCredential, GOOGLE_CLIENT_ID } from '../lib/auth';

const TAGLINE = 'Turn Data Into Decisions ✦ Know Your Numbers ✦ AI-CFO ✦ Real-Time Insights ✦ Smart Finance ✦ Your Virtual CFO ✦';

const features = [
  { icon: Brain,       label: 'AI-Powered Insights'  },
  { icon: TrendingUp,  label: 'Real-Time Forecasting' },
  { icon: ShieldCheck, label: 'Anomaly Detection'     },
];

// ── Reusable input field ──────────────────────────────────────────────────────
const Input = ({ icon: Icon, type = 'text', placeholder, value, onChange, right, autoComplete }) => (
  <div className="relative">
    {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full bg-white/5 border border-white/12 rounded-xl py-3 text-sm text-slate-200 placeholder-slate-600
        outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200 pl-10 pr-10"
    />
    {right}
  </div>
);

// ── Demo Google Popup ─────────────────────────────────────────────────────────
// Simulates Google's account chooser when no real Client ID is available.
const DEMO_ACCOUNTS = [
  { name: 'Amay Ranjan',   email: 'amay.ranjan@gmail.com',   avatar: '🧑‍💼' },
  { name: 'Demo CFO',      email: 'cfo.demo@company.com',    avatar: '💼'  },
  { name: 'Finance Lead',  email: 'finance@startup.io',      avatar: '📊'  },
];

const DemoGooglePopup = ({ onSelect, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
  >
    <div
      className="bg-[#1A1A2E] border border-white/10 rounded-2xl w-80 overflow-hidden shadow-2xl animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Google header */}
      <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoogleIcon size={20} />
          <div>
            <p className="text-sm font-semibold text-slate-100">Sign in with Google</p>
            <p className="text-[11px] text-slate-500">Choose an account</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Account list */}
      <div className="py-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            onClick={() => onSelect(acc)}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shrink-0">
              {acc.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">{acc.name}</p>
              <p className="text-xs text-slate-400">{acc.email}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-white/8">
        <p className="text-[10px] text-slate-600 text-center">
          Demo mode — add <code className="text-blue-400">VITE_GOOGLE_CLIENT_ID</code> to .env for real OAuth
        </p>
      </div>
    </div>
  </div>
);

// ── Google Auth Button ────────────────────────────────────────────────────────
const GoogleAuthButton = ({ onCredential, onDemoSelect, label }) => {
  const btnRef  = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Real GSI init (only when Client ID provided)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback:  onCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size:  'large',
          width: '100%',
          text:  label === 'register' ? 'signup_with' : 'signin_with',
          shape: 'pill',
        });
        setGsiReady(true);
      }
    };
    if (window.google?.accounts?.id) { init(); }
    else {
      const t = setInterval(() => { if (window.google?.accounts?.id) { clearInterval(t); init(); } }, 200);
      return () => clearInterval(t);
    }
  }, [label, onCredential]);

  // When real GSI button is ready, render it
  if (GOOGLE_CLIENT_ID) {
    return <div ref={btnRef} className={`w-full transition-opacity duration-300 ${gsiReady ? 'opacity-100' : 'opacity-0 h-12'}`} />;
  }

  // Demo mode: styled button + popup
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDemo(true)}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-white/15
          bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all duration-200 active:scale-[0.98]"
      >
        <GoogleIcon size={18} />
        <span className="text-sm font-semibold text-slate-200">
          {label === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
        </span>
      </button>

      {showDemo && (
        <DemoGooglePopup
          onSelect={(acc) => {
            setShowDemo(false);
            onDemoSelect(acc);
          }}
          onClose={() => setShowDemo(false)}
        />
      )}
    </>
  );
};

// ── Sign In Tab ───────────────────────────────────────────────────────────────
const SignInTab = ({ onLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(null);
  const [error, setError]       = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(''); setLoading('email');
    const result = loginUser({ email, password });
    if (result.success) { onLogin(result.user); }
    else { setError(result.error); setLoading(null); }
  };

  // Real Google credential (GSI JWT)
  const handleGoogleCred = (resp) => {
    setError(''); setLoading('google');
    const result = handleGoogleCredential(resp);
    if (result.success) { onLogin(result.user); }
    else { setError(result.error); setLoading(null); }
  };

  // Demo Google account selected
  const handleDemoGoogle = (acc) => {
    setLoading('google');
    const fakeUser = {
      id: `g_demo_${Date.now()}`, name: acc.name, email: acc.email,
      photo: null, provider: 'google', isNew: false,
    };
    setTimeout(() => onLogin(fakeUser), 400);
  };

  const handleGuest = async () => {
    setLoading('guest');
    await new Promise(r => setTimeout(r, 400));
    onLogin({ name: 'Guest', email: null, photo: null, isNew: false, provider: 'guest' });
  };

  return (
    <div className="flex flex-col gap-4">
      <GoogleAuthButton onCredential={handleGoogleCred} onDemoSelect={handleDemoGoogle} label="signin" />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" /><span className="text-xs text-slate-600">or with email</span><div className="flex-1 h-px bg-white/8" />
      </div>

      {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <Input icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={setEmail} autoComplete="email" />
        <Input
          icon={Lock} type={show ? 'text' : 'password'} placeholder="Password"
          value={password} onChange={setPassword} autoComplete="current-password"
          right={
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />
        <button id="btn-signin-email" type="submit" disabled={!!loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
            disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]">
          {loading === 'email' ? <span className="animate-pulse">Signing in…</span> : <><ArrowRight size={15} /> Sign In</>}
        </button>
      </form>

      <button id="btn-guest" onClick={handleGuest} disabled={!!loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm text-slate-400 border border-white/8
          hover:text-slate-200 hover:bg-white/5 hover:border-white/15 transition-all disabled:opacity-40">
        <UserRound size={15} /> Continue as Guest
      </button>
    </div>
  );
};

// ── Register Tab ──────────────────────────────────────────────────────────────
const RegisterTab = ({ onLogin }) => {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(null);
  const [error, setError]         = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading('email');
    const result = registerUser({ name, email, password });
    if (result.success) { onLogin(result.user); }
    else { setError(result.error); setLoading(null); }
  };

  const handleGoogleCred = (resp) => {
    setError(''); setLoading('google');
    const result = handleGoogleCredential(resp);
    if (result.success) { onLogin(result.user); }
    else { setError(result.error); setLoading(null); }
  };

  const handleDemoGoogle = (acc) => {
    setLoading('google');
    const fakeUser = {
      id: `g_demo_${Date.now()}`, name: acc.name, email: acc.email,
      photo: null, provider: 'google', isNew: true,
    };
    setTimeout(() => onLogin(fakeUser), 400);
  };

  const pwStrength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'medium' : 'strong';

  return (
    <div className="flex flex-col gap-4">
      <GoogleAuthButton onCredential={handleGoogleCred} onDemoSelect={handleDemoGoogle} label="register" />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" /><span className="text-xs text-slate-600">or with email</span><div className="flex-1 h-px bg-white/8" />
      </div>

      {error && <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <Input icon={UserRound} placeholder="Full Name" value={name} onChange={setName} autoComplete="name" />
        <Input icon={Mail} type="email" placeholder="Work Email" value={email} onChange={setEmail} autoComplete="email" />
        <div>
          <Input
            icon={Lock} type={show ? 'text' : 'password'} placeholder="Password (min 6 chars)"
            value={password} onChange={setPassword} autoComplete="new-password"
            right={
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          {pwStrength && (
            <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${
                pwStrength === 'weak' ? 'bg-red-500 w-1/3' : pwStrength === 'medium' ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-full'
              }`} />
            </div>
          )}
        </div>
        <Input icon={Lock} type="password" placeholder="Confirm Password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

        <button id="btn-register" type="submit" disabled={!!loading || !name || !email || !password || !confirm}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white
            bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500
            disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]">
          {loading === 'email' ? <span className="animate-pulse">Creating account…</span> : <><UserPlus size={15} /> Create Account</>}
        </button>
      </form>
    </div>
  );
};

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState('signin');

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 10 }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Card */}
      <div className="login-card relative w-full max-w-sm mx-4 px-7 py-8 rounded-3xl animate-slide-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight grad-main">AI-CFO</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Multi-Agent Financial Decision Support System</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 flex-wrap mb-6">
          {features.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/8 text-slate-400">
              <Icon size={11} className="text-blue-400" />{label}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 border border-white/8 p-0.5 mb-5">
          {[{ key: 'signin', label: 'Sign In' }, { key: 'register', label: 'Register' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'signin'   && <SignInTab   onLogin={onLogin} />}
        {tab === 'register' && <RegisterTab onLogin={onLogin} />}

        <p className="text-[10px] text-slate-600 text-center mt-5 leading-relaxed">
          By continuing you agree to our{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer underline underline-offset-2">Terms of Service</span>
          {' '}and{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>

      {/* CurvedLoop */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ opacity: 0.55 }}>
        <CurvedLoop marqueeText={TAGLINE} speed={1.8} curveAmount={180} direction="left" />
      </div>
    </div>
  );
}

// ── Google SVG icon ───────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
