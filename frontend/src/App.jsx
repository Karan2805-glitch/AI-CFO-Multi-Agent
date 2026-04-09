import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Navigation     from './components/Navigation';
import SilkBackground from './components/SilkBackground';
import LoginPage      from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import UploadPage     from './pages/UploadPage';
import Dashboard      from './pages/Dashboard';
import Ledger         from './pages/Ledger';
import Forecast       from './pages/Forecast';
import { useData }    from './context/DataContext';
import { loadSession, saveSession, clearSession } from './lib/auth';

/**
 * Initial state rules (simple & predictable):
 *   hasData  → 'app'   (skip straight to dashboard)
 *   no data  → 'login' (always start from login so user can pick an account)
 *
 * We do NOT auto-jump to 'upload' based on stale session alone,
 * because that leaves users stuck on UploadPage with no clear way back.
 */
const getInitialState = (hasData) => (hasData ? 'app' : 'login');

export default function App() {
  const { hasData } = useData();
  const [authState, setAuthState] = useState(() => getInitialState(hasData));
  const [currentUser, setCurrentUser] = useState(() => loadSession());

  const handleLogin = (user) => {
    setCurrentUser(user);
    saveSession(user);
    // New user (not guest) → onboarding wizard
    if (user.isNew && user.provider !== 'guest') {
      setAuthState('onboarding');
    } else {
      setAuthState('upload');
    }
  };

  const handleOnboardingComplete = (userWithProfile) => {
    setCurrentUser(userWithProfile);
    saveSession(userWithProfile);
    setAuthState('upload');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setAuthState('login');
  };

  return (
    <>
      <SilkBackground />

      {/* Ambient glows */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-700/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[120px]" />
      </div>

      {authState === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {authState === 'onboarding' && (
        <OnboardingPage user={currentUser} onComplete={handleOnboardingComplete} />
      )}

      {authState === 'upload' && (
        <UploadPage
          onSuccess={() => setAuthState('app')}
          onBack={() => setAuthState('login')}
        />
      )}

      {authState === 'app' && (
        <div className="flex w-screen h-screen overflow-hidden relative z-10">
          <Navigation user={currentUser} onLogout={handleLogout} />
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
