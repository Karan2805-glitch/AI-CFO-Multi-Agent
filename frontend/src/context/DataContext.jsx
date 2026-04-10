import React, { createContext, useContext, useMemo, useState } from 'react';
import { clearDashboardState, loadDashboardState, saveDashboardState } from '../api/analyzeService';

const DataContext = createContext({
  sessionId: null,
  runId: null,
  dashboardData: null,
  setDashboardState: () => {},
  setLoading: () => {},
  setError: () => {},
  loading: false,
  error: null,
  clearData: () => {},
  hasData: false,
});

export const DataProvider = ({ children }) => {
  const persisted = loadDashboardState();
  const [sessionId, setSessionId] = useState(persisted?.sessionId ?? null);
  const [runId, setRunId] = useState(persisted?.runId ?? null);
  const [dashboardData, setDashboardData] = useState(persisted?.dashboardData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setDashboardState = (state) => {
    setSessionId(state?.sessionId ?? null);
    setRunId(state?.runId ?? null);
    setDashboardData(state?.dashboardData ?? null);
    if (state) saveDashboardState(state);
  };

  const clearData = () => {
    setSessionId(null);
    setRunId(null);
    setDashboardData(null);
    setLoading(false);
    setError(null);
    clearDashboardState();
  };

  const value = useMemo(() => ({
    sessionId,
    runId,
    dashboardData,
    setDashboardState,
    loading,
    setLoading,
    error,
    setError,
    clearData,
    hasData: !!dashboardData,
  }), [sessionId, runId, dashboardData, loading, error]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
