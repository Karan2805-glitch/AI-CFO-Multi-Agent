import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Building2, Users, User, Briefcase, CheckCircle2, ChevronDown } from 'lucide-react';
import CurvedLoop from '../components/CurvedLoop';

const TAGLINE = 'Tell Us About You ✦ Build Your Profile ✦ AI-CFO ✦ Personalized Intelligence ✦ Smart Finance ✦ Your Virtual CFO ✦';

// ── Step config ───────────────────────────────────────────────────────────────
const COMPANY_SIZES = [
  '1–10 (Startup / Solo)',
  '11–50 (Small Business)',
  '51–200 (Growth Stage)',
  '201–500 (Mid-Market)',
  '500+ (Enterprise)',
];

const INDUSTRIES = [
  'Technology / SaaS',
  'Finance & Banking',
  'Healthcare',
  'E-Commerce / Retail',
  'Manufacturing',
  'Real Estate',
  'Consulting / Services',
  'Education',
  'Other',
];

const ROLES = [
  'Founder / CEO',
  'CFO / Finance Head',
  'Financial Analyst',
  'Accountant',
  'Operations Manager',
  'Product / Strategy',
  'Other',
];

// ── Reusable Input ────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-blue-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({ placeholder, value, onChange, icon: Icon }) => (
  <div className="relative">
    {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />}
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white/5 border border-white/12 rounded-xl py-3 text-sm text-slate-200 placeholder-slate-600 outline-none
        focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200
        ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
    />
  </div>
);

const SelectInput = ({ options, value, onChange, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full appearance-none bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none
        focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200 cursor-pointer"
      style={{ colorScheme: 'dark' }}
    >
      <option value="" disabled className="bg-[#0D1526] text-slate-500">{placeholder}</option>
      {options.map(o => (
        <option key={o} value={o} className="bg-[#0D1526] text-slate-200">{o}</option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
  </div>
);

// ── Step indicators ────────────────────────────────────────────────────────────
const StepDots = ({ total, current }) => (
  <div className="flex items-center gap-2 mb-7">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1 rounded-full transition-all duration-400 ${
        i < current ? 'bg-blue-500 w-6' : i === current ? 'bg-blue-400 w-8' : 'bg-white/10 w-4'
      }`} />
    ))}
  </div>
);

// ── Main Onboarding ────────────────────────────────────────────────────────────
export default function OnboardingPage({ user, onComplete }) {
  const [step, setStep] = useState(0); // 0 = personal, 1 = org, 2 = done
  const [form, setForm] = useState({
    fullName:    user?.name || '',
    role:        '',
    orgName:     '',
    industry:    '',
    orgSize:     '',
    website:     '',
    goals:       '',
  });

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const step0Valid = form.fullName.trim() && form.role;
  const step1Valid = form.orgName.trim() && form.industry && form.orgSize;

  const handleFinish = () => {
    onComplete({ ...user, profile: form });
  };

  return (
    <div className="relative flex items-center justify-center w-screen h-screen overflow-hidden z-10">

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
      </div>

      {/* ── CurvedLoop tagline at top */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ opacity: 0.55 }}>
        <CurvedLoop
          marqueeText={TAGLINE}
          speed={1.5}
          curveAmount={160}
          direction="right"
          interactive={false}
          className="curved-loop-text"
        />
      </div>

      <div className="onboarding-card relative w-full max-w-md mx-4 px-8 py-8 rounded-3xl page-enter">

        {/* Brand top strip */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">AI</span>
          </div>
          <span className="text-sm font-bold grad-main">AI-CFO</span>
          <span className="ml-auto text-xs text-slate-600">Setup · Step {step + 1} of 3</span>
        </div>

        <StepDots total={3} current={step} />

        {/* ── Step 0: Personal Info */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Tell us about yourself</h2>
              <p className="text-slate-500 text-sm mt-1">This helps us personalize your experience.</p>
            </div>

            <Field label="Full Name" required>
              <TextInput icon={User} placeholder="Ada Lovelace" value={form.fullName} onChange={set('fullName')} />
            </Field>

            <Field label="Your Role" required>
              <SelectInput options={ROLES} value={form.role} onChange={set('role')} placeholder="Select your role…" />
            </Field>

            <button
              id="btn-onboard-next-0"
              disabled={!step0Valid}
              onClick={() => setStep(1)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white
                bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── Step 1: Organisation Info */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100">About your organisation</h2>
              <p className="text-slate-500 text-sm mt-1">We'll tailor benchmarks to your company profile.</p>
            </div>

            <Field label="Organisation Name" required>
              <TextInput icon={Building2} placeholder="Acme Corp" value={form.orgName} onChange={set('orgName')} />
            </Field>

            <Field label="Industry" required>
              <SelectInput options={INDUSTRIES} value={form.industry} onChange={set('industry')} placeholder="Select industry…" />
            </Field>

            <Field label="Company Size" required>
              <SelectInput options={COMPANY_SIZES} value={form.orgSize} onChange={set('orgSize')} placeholder="Select headcount…" />
            </Field>

            <Field label="Website (optional)">
              <TextInput placeholder="https://acme.com" value={form.website} onChange={set('website')} />
            </Field>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm text-slate-400 border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                id="btn-onboard-next-1"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white
                  bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Goals */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100">What are your goals?</h2>
              <p className="text-slate-500 text-sm mt-1">Optional: help us surface the most relevant insights.</p>
            </div>

            <Field label="Primary Financial Goals">
              <textarea
                value={form.goals}
                onChange={e => set('goals')(e.target.value)}
                placeholder="e.g. Reduce operational costs, improve cash flow visibility, detect budget overruns early…"
                rows={4}
                className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600
                  outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all duration-200 resize-none"
              />
            </Field>

            {/* Summary card */}
            <div className="rounded-2xl bg-blue-500/8 border border-blue-500/15 p-4 flex flex-col gap-2">
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-0.5">Your Profile Summary</p>
              {[
                { label: 'Name',         val: form.fullName },
                { label: 'Role',         val: form.role     },
                { label: 'Organisation', val: form.orgName  },
                { label: 'Industry',     val: form.industry },
                { label: 'Size',         val: form.orgSize  },
              ].map(({ label, val }) => val ? (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{val}</span>
                </div>
              ) : null)}
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm text-slate-400 border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                id="btn-onboard-finish"
                onClick={handleFinish}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white
                  bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500
                  transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <CheckCircle2 size={16} /> Launch Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
