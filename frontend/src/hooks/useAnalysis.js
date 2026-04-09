/**
 * useAnalysis.js
 * 
 * Adapter hook — maps the raw backend API response to the shape
 * each dashboard page expects. Falls back to mockData when no
 * real analysis is available (so pages still render during dev).
 */
import { useData } from '../context/DataContext';
import {
  kpiData as mockKpi,
  normalizationData as mockNorm,
  trendData as mockTrend,
  forecastData as mockForecast,
  expenseData as mockExpenses,
  anomalyAlerts as mockAnomalies,
  benchmarkData as mockBenchmark,
  recommendations as mockRecommendations,
  healthScore as mockHealth,
  scenarioData as mockScenario,
} from '../mockData';

const fmt = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v}`;
};

const pct = (v) => `${parseFloat(v).toFixed(1)}%`;

export const useAnalysis = () => {
  const { analysisData } = useData();

  // ── No real data yet → fall back to mock ─────────────────────────
  if (!analysisData) {
    return {
      isReal: false,
      kpiCards: mockKpi,
      normalization: mockNorm,
      trendData: mockTrend,
      forecastData: mockForecast,
      expenseData: mockExpenses,
      anomalyAlerts: mockAnomalies,
      benchmarkData: mockBenchmark,
      recommendations: mockRecommendations,
      healthScore: mockHealth,
      scenarioData: mockScenario,
      risk: null,
      auditorExplanation: null,
    };
  }

  const { kpi, ratios, risk, recommendations, health_score, auditor, forecast, anomalies } = analysisData;

  // ── KPI Cards ─────────────────────────────────────────────────────
  const kpiCards = [
    {
      id: 'revenue', label: 'Total Revenue',
      value: kpi.total_revenue,
      formatted: fmt(kpi.total_revenue),
      delta: `avg ${fmt(kpi.avg_monthly_revenue)}/mo`,
      deltaPositive: true,
      sub: 'from uploaded data',
      color: 'blue', icon: 'DollarSign',
    },
    {
      id: 'expenses', label: 'Total Expenses',
      value: kpi.total_expenses,
      formatted: fmt(kpi.total_expenses),
      delta: `${pct(ratios.total_expense_ratio)} of revenue`,
      deltaPositive: ratios.total_expense_ratio < 70,
      sub: 'expense ratio',
      color: 'red', icon: 'TrendingDown',
    },
    {
      id: 'profit', label: 'Net Profit',
      value: kpi.profit,
      formatted: fmt(kpi.profit),
      delta: kpi.profit >= 0 ? 'Profitable' : 'Running at loss',
      deltaPositive: kpi.profit >= 0,
      sub: 'revenue minus expenses',
      color: 'green', icon: 'BarChart2',
    },
    {
      id: 'margin', label: 'Profit Margin',
      value: kpi.profit_margin,
      formatted: pct(kpi.profit_margin),
      delta: `Risk: ${risk?.risk_level ?? 'N/A'}`,
      deltaPositive: (risk?.risk_level ?? 'HIGH') === 'LOW',
      sub: 'vs peer avg 28.5%',
      color: 'purple', icon: 'Activity',
    },
  ];

  // ── Normalization ─────────────────────────────────────────────────
  const normalization = {
    profit_margin:   parseFloat((kpi.profit_margin / 100).toFixed(4)),
    expense_ratio:   parseFloat((ratios.total_expense_ratio / 100).toFixed(4)),
    salary_ratio:    parseFloat(((ratios.expense_ratios?.salaries_ratio ?? 0) / 100).toFixed(4)),
    marketing_ratio: parseFloat(((ratios.expense_ratios?.marketing_ratio ?? 0) / 100).toFixed(4)),
  };

  // ── Forecast Chart (historical + forecast points) ─────────────────
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const forecastChartData = forecast.historical.map((v, i) => ({
    month: months[i % 12] ?? `M${i+1}`,
    revenue: v,
  }));
  forecast.forecast.forEach((v, i) => {
    forecastChartData.push({
      month: `${months[(forecast.historical.length + i) % 12]}+`,
      forecast: v,
    });
  });

  // ── Trend (rev vs expenses — use historical for revenue, extrapolate expenses) ─
  const expBreak = kpi.expense_breakdown ?? {};
  const totalExp = kpi.total_expenses;
  const trendData = forecast.historical.map((rev, i) => ({
    month: months[i % 12] ?? `M${i+1}`,
    revenue: rev,
    expenses: Math.round(totalExp / forecast.historical.length),
  }));

  // ── Expense Breakdown ─────────────────────────────────────────────
  const expColors = ['#3B82F6','#F43F5E','#8B5CF6','#F59E0B','#14B8A6','#94A3B8'];
  const expenseData = Object.entries(expBreak).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    pct: Math.round((value / kpi.total_expenses) * 100),
    color: expColors[i % expColors.length],
  }));

  // ── Anomaly Alerts ────────────────────────────────────────────────
  const severityMap = (flag) => {
    if (flag.toLowerCase().includes('revenue drop') || flag.toLowerCase().includes('loss')) return 'critical';
    if (flag.toLowerCase().includes('anomaly')) return 'warning';
    return 'info';
  };
  const anomalyAlerts = anomalies.length > 0
    ? anomalies.map((msg, i) => ({
        id: i + 1,
        severity: severityMap(msg),
        category: 'AI Detection',
        title: msg,
        detail: risk?.risk_flags?.join('. ') ?? msg,
        deviation: risk?.risk_level ?? 'N/A',
      }))
    : [{
        id: 1, severity: 'info', category: 'System',
        title: 'No anomalies detected',
        detail: 'All financial metrics appear to be within normal ranges.',
        deviation: '✓',
      }];

  // ── Recommendations ───────────────────────────────────────────────
  const priorityColors = ['red','amber','blue','purple'];
  const recList = recommendations.recommendations ?? [];
  const recs = recList.map((text, i) => ({
    id: i + 1,
    priority: i === 0 ? 'High' : i === 1 ? 'High' : 'Medium',
    action: text.split(' ').slice(0, 6).join(' ') + '…',
    rationale: text,
    impact: 'Based on AI analysis',
    color: priorityColors[i % priorityColors.length],
  }));

  // ── Health Score ──────────────────────────────────────────────────
  const healthScore = {
    score: health_score,
    label: health_score >= 80 ? 'Excellent' : health_score >= 60 ? 'Stable' : health_score >= 40 ? 'At Risk' : 'Critical',
    breakdown: [
      { name: 'Profit Margin',     score: Math.min(100, Math.round(kpi.profit_margin * 2.5)) },
      { name: 'Expense Ratio',     score: Math.max(0, Math.round(100 - ratios.total_expense_ratio)) },
      { name: 'Cost Distribution', score: Math.min(100, Math.round(health_score * 1.05)) },
      { name: 'Risk Level',        score: risk?.risk_level === 'LOW' ? 90 : risk?.risk_level === 'MEDIUM' ? 70 : 40 },
    ],
  };

  // ── Scenario Data (derived from kpi) ─────────────────────────────
  const baseProfit = kpi.profit;
  const scenarioData = [
    { scenario: 'Base Case',      profit: baseProfit,                           label: 'Current' },
    { scenario: 'Marketing -15%', profit: baseProfit + kpi.total_expenses * 0.15 * 0.136, label: '+savings' },
    { scenario: 'Expenses -10%',  profit: baseProfit + kpi.total_expenses * 0.10,          label: '+10% cut' },
    { scenario: 'Revenue +10%',   profit: baseProfit + kpi.total_revenue * 0.10,           label: '+10% rev' },
    { scenario: 'Marketing +10%', profit: baseProfit - kpi.total_expenses * 0.10 * 0.136, label: '-overhead' },
  ];

  return {
    isReal: true,
    kpiCards,
    normalization,
    trendData,
    forecastData: forecastChartData,
    expenseData,
    anomalyAlerts,
    benchmarkData: mockBenchmark, // benchmark is static (TCS/Infosys/Wipro)
    recommendations: recs,
    healthScore,
    scenarioData,
    risk,
    auditorExplanation: auditor?.explanation ?? null,
  };
};
