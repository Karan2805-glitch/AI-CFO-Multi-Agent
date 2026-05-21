import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';

// Mock context or hooks if necessary, for now we just render it wrapped in Router
// since it might use Links. If it uses DataContext, we might need a custom render.
vi.mock('../../context/DataContext', () => ({
  useData: () => ({
    dashboardData: {
      health_score: 85,
      insights: { summary: "Test Insight", recommendations: ["Test Rec 1"] },
      kpis: { total_revenue: 1000, total_expenses: 500 },
      risk: { level: "Low", details: { risk_flags: [] } },
      charts: { revenue_trend: [], expense_trend: [], forecast: [], expense_breakdown: {} }
    },
    loading: false,
    error: null,
    runId: '123',
    sessionId: 'abc'
  })
}));

describe('Dashboard Page', () => {
  it('renders dashboard with mocked data', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Simple checks to ensure it renders main sections
    expect(screen.getByText(/Executive Dashboard/i)).toBeInTheDocument();
  });
});
