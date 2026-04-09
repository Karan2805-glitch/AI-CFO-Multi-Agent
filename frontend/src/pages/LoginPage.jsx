import React, { useState } from 'react';
import { Sparkles, UserRound, ArrowRight, ShieldCheck, TrendingUp, Brain } from 'lucide-react';
import CurvedLoop from '../components/CurvedLoop';

// ── Project tagline ───────────────────────────────────────────────────────────
const TAGLINE = 'Turn Data Into Decisions ✦ Know Your Numbers ✦ AI-CFO ✦ Real-Time Insights ✦ Smart Finance ✦ Your Virtual CFO ✦';

// ── Feature Pills ─────────────────────────────────────────────────────────────
const features = [
  { icon: Brain,      label: 'AI-Powered Insights'   },
  { icon: TrendingUp, label: 'Real-Time Forecasting'  },
  { icon: ShieldCheck,label: 'Anomaly Detection'      },
];

// ── Google mock handler ───────────────────────────────────────────────────────
// In production, replace with real OAuth flow (Firebase Auth / Supabase / NextAuth)
const MOCK_GOOGLE_USER = {
  name:  'Amay Ranjan',
  email: 'amay@example.com',
  photo: null,
  isNew: true, // flip to false to skip onboarding
};

export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(null); // 'google' | 'guest'


  const handleGoogle = async () => {
    setLoading('google');
    // Simulate OAuth round-trip
    await new Promise(r => setTimeout(r, 1400));
    setLoading(null);
    onLogin({ ...MOCK_GOOGLE_USER, provider: 'google' });
  };

  const handleGuest = async () => {
    setLoading('guest');
    await new Promise(r => setTimeout(r, 600));
    setLoading(null);
    onLogin({ name: 'Guest', email: null, photo: null, isNew: false, provider: 'guest' });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 10 }}>

      {/* ── Decorative ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/12 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/12 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/6 rounded-full blur-[80px]" />
      </div>

      {/* ── Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* ── Main Card */}
      <div className="login-card relative flex flex-col items-center w-full max-w-md mx-4 px-8 py-10 rounded-3xl page-enter">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles size={26} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight grad-main">AI-CFO</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Multi-Agent Financial Decision Support System</p>
          </div>
        </div>

        {/* Divider + Heading */}
        <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
          Sign in to access your financial intelligence dashboard, anomaly alerts, and AI-driven forecasts.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
              <Icon size={11} className="text-blue-400" />
              {label}
            </div>
          ))}
        </div>

        {/* ── Google Sign-In Button */}
        <button
          id="btn-google-signin"
          onClick={handleGoogle}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm text-white border transition-all duration-300 mb-3
            bg-white/6 border-white/15 hover:bg-white/12 hover:border-white/25 hover:shadow-lg hover:shadow-blue-500/10
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading === 'google' ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {loading === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
        </button>

        {/* ── Separator */}
        <div className="w-full flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-slate-600 font-medium">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* ── Guest Button */}
        <button
          id="btn-guest-login"
          onClick={handleGuest}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm border transition-all duration-300
            text-slate-300 bg-white/3 border-white/10 hover:bg-white/8 hover:border-white/20 hover:text-slate-100
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading === 'guest' ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-slate-200 animate-spin" />
          ) : (
            <UserRound size={16} className="text-slate-400" />
          )}
          {loading === 'guest' ? 'Entering as guest…' : 'Continue as Guest'}
          {!loading && <ArrowRight size={14} className="text-slate-500 ml-auto" />}
        </button>

        {/* Fine print */}
        <p className="text-[11px] text-slate-700 text-center mt-6 leading-relaxed">
          By signing in you agree to our{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer underline underline-offset-2">Terms of Service</span>
          {' '}and{' '}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>

      {/* ── CurvedLoop tagline at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ opacity: 0.55 }}>
        <CurvedLoop
          marqueeText={TAGLINE}
          speed={1.8}
          curveAmount={180}
          direction="left"
          interactive={false}
          className="curved-loop-text"
        />
      </div>
    </div>
  );
}

// ── Inline Google SVG icon ────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
