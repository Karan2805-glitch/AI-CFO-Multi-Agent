import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadAnalysis, saveAnalysis, clearAnalysis } from '../api/analyzeService';

/**
 * DataContext — global store for the backend analysis result.
 * Hydrates from localStorage on mount so data persists across refreshes.
 * 
 * Shape of `analysisData`:
 * {
 *   kpi:             { total_revenue, total_expenses, profit, profit_margin,
 *                      avg_monthly_revenue, expense_breakdown }
 *   ratios:          { expense_ratios, total_expense_ratio, profit_margin }
 *   risk:            { risk_level, risk_flags }
 *   recommendations: { recommendations: [...strings] }
 *   health_score:    number (0-100)
 *   auditor:         { explanation: string }
 *   forecast:        { historical: [...], forecast: [...] }
 *   anomalies:       [...strings]
 * }
 */

const DataContext = createContext({
  analysisData: null,
  setAnalysisData: () => {},
  clearData: () => {},
  hasData: false,
});

export const DataProvider = ({ children }) => {
  const [analysisData, setAnalysisDataState] = useState(() => loadAnalysis());

  const setAnalysisData = (data) => {
    setAnalysisDataState(data);
    if (data) saveAnalysis(data);
  };

  const clearData = () => {
    setAnalysisDataState(null);
    clearAnalysis();
  };

  return (
    <DataContext.Provider value={{
      analysisData,
      setAnalysisData,
      clearData,
      hasData: !!analysisData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
