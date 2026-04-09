import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Navigation    from './components/Navigation';
import SilkBackground from './components/SilkBackground';
import LoginPage     from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import UploadPage    from './pages/UploadPage';
import Dashboard     from './pages/Dashboard';
import Ledger        from './pages/Ledger';
import Forecast      from './pages/Forecast';

// auth states: 'login' | 'onboarding' | 'upload' | 'app'
export default function App() {
  const [authState, setAuthState] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.provider === 'google' && user.isNew) {
      setAuthState('onboarding');
    } else {
      setAuthState('upload');
    }
  };

  const handleOnboardingComplete = (userWithProfile) => {
    setCurrentUser(userWithProfile);
    setAuthState('upload');
  };

  return (
    <>
      {/* Full-screen silk animation */}
      <SilkBackground />

      {/* Ambient radial glows */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-700/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[120px]" />
      </div>

      {/* ── Auth: Login */}
      {authState === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {/* ── Auth: Onboarding (new Google users) */}
      {authState === 'onboarding' && (
        <OnboardingPage user={currentUser} onComplete={handleOnboardingComplete} />
      )}

      {/* ── Auth: Upload CSV */}
      {authState === 'upload' && !ready && (
        <UploadPage onSuccess={() => { setReady(true); setAuthState('app'); }} />
      )}

      {/* ── Main App */}
      {authState === 'app' && ready && (
        <div className="flex w-screen h-screen overflow-hidden relative z-10">
          <Navigation user={currentUser} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-8">
            <div className="max-w-5xl mx-auto">
              <Routes>
                <Route path="/"          element={<Navigate to="/dashboard" replace />} />
                <Route path="/upload"    element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ledger"    element={<Ledger />} />
                <Route path="/forecast"  element={<Forecast />} />
                <Route path="*"          element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

