import { useData } from '../context/DataContext';

const COLORS = [
  '#3B82F6', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#64748B'
];

/**
 * Orchestration graph definition — mirrors the backend execution_graph metadata
 * from orchestrator.py without requiring any backend changes.
 */
const EXECUTION_GRAPH = {
  stages: [
    { id: 'stage_1_foundation',         label: 'Foundation',       agents: ['preprocessing', 'kpis', 'ratios'] },
    { id: 'stage_2_fanout',             label: 'Intelligence',     agents: ['forecast_agent', 'anomaly_agent', 'health_agent'] },
    { id: 'stage_3_synthesis',          label: 'Synthesis',        agents: ['risk_agent', 'recommendation_agent'] },
    { id: 'stage_4_executive_synthesis', label: 'Executive',       agents: ['auditor_agent'] },
  ],
  nodes: [
    { id: 'foundation',          label: 'Foundation',       stage: 0, icon: 'Database' },
    { id: 'forecast_agent',      label: 'Forecast',         stage: 1, icon: 'TrendingUp' },
    { id: 'anomaly_agent',       label: 'Anomaly',          stage: 1, icon: 'AlertTriangle' },
    { id: 'health_agent',        label: 'Health',           stage: 1, icon: 'Heart' },
    { id: 'risk_agent',          label: 'Risk',             stage: 2, icon: 'Shield' },
    { id: 'recommendation_agent', label: 'Recommend',      stage: 2, icon: 'Lightbulb' },
    { id: 'auditor_agent',       label: 'Auditor',          stage: 3, icon: 'Brain' },
  ],
  edges: [
    { from: 'foundation',     to: 'forecast_agent' },
    { from: 'foundation',     to: 'anomaly_agent' },
    { from: 'foundation',     to: 'health_agent' },
    { from: 'forecast_agent', to: 'risk_agent' },
    { from: 'anomaly_agent',  to: 'risk_agent' },
    { from: 'health_agent',   to: 'risk_agent' },
    { from: 'risk_agent',     to: 'recommendation_agent' },
    { from: 'recommendation_agent', to: 'auditor_agent' },
  ],
};

const safeArray = (v) => (Array.isArray(v) ? v : []);
export const useAnalysis = () => {
  const { dashboardData } = useData();
  const hasData = !!dashboardData;
  const isDemo = !dashboardData;

  const kpis = isDemo
    ? { profit_margin: '23.4', profit: 563000 }
    : (dashboardData?.kpis ?? {});

  // ── Charts (existing + fallbacks) ──────────────────────────
  const revenueTrend = isDemo
    ? [
        { month: 'Oct 25', revenue: 210000 },
        { month: 'Nov 25', revenue: 225000 },
        { month: 'Dec 25', revenue: 218000 },
        { month: 'Jan 26', revenue: 240000 },
        { month: 'Feb 26', revenue: 235000 },
        { month: 'Mar 26', revenue: 248000 },
      ]
    : safeArray(dashboardData?.charts?.revenue_trend);

  const forecastTrend = isDemo
    ? [
        { month: 'Apr 26', forecast: 254000 },
        { month: 'May 26', forecast: 260000 },
        { month: 'Jun 26', forecast: 268000 },
        { month: 'Jul 26', forecast: 275000 },
        { month: 'Aug 26', forecast: 282000 },
        { month: 'Sep 26', forecast: 290000 },
      ]
    : safeArray(dashboardData?.charts?.forecast);

  const expenseTrend = isDemo
    ? [
        { month: 'Oct 25', expenses: 150000 },
        { month: 'Nov 25', expenses: 158000 },
        { month: 'Dec 25', expenses: 162000 },
        { month: 'Jan 26', expenses: 155000 },
        { month: 'Feb 26', expenses: 168000 },
        { month: 'Mar 26', expenses: 142000 },
      ]
    : safeArray(dashboardData?.charts?.expense_trend);

  const combinedForecast = [
    ...revenueTrend.map((v, i) => ({
      month: v.month || `P${i + 1}`,
      revenue: v.revenue ?? v,
      expenses: expenseTrend[i]?.expenses ?? expenseTrend[i] ?? 0,
    })),
    ...forecastTrend.map((v, i) => ({
      month: v.month || `P${revenueTrend.length + i + 1}`,
      forecast: v.revenue ?? v.forecast ?? v,
    })),
  ];

  const expensesObj = isDemo
    ? {
        'Salaries & Benefits': 642000,
        'Operations & Facilities': 296000,
        'Marketing & Sales': 220000,
        'R&D / Infrastructure': 180000,
        'Software & SaaS Tools': 162000,
        'Administrative & Legal': 140000,
      }
    : (dashboardData?.charts?.expense_breakdown ?? {});

  const totalExp = Object.values(expensesObj).reduce((sum, val) => sum + (val || 0), 0);
  const expenseData = Object.entries(expensesObj).map(([name, value], i) => ({
    name,
    value,
    pct: totalExp > 0 ? ((value / totalExp) * 100).toFixed(1) : 0,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  // ── Risk (existing + fallbacks) ─────────────────────────────
  const riskLevel = isDemo ? 'MEDIUM' : (dashboardData?.risk?.level ?? 'UNKNOWN');
  const riskFlags = isDemo
    ? ['Burn rate increased 8% QoQ', 'AR collection slowdown detected']
    : safeArray(dashboardData?.risk?.details?.risk_flags);

  const riskDetails = isDemo ? {
    risk_dimensions: { liquidity: 80, operational: 65, market: 70, credit: 60, compliance: 85, systemic: 75 },
    confidence: 0.85,
    summary: 'Overall risk profile is moderate, constrained by marketing spend seasonality.',
    findings: ['Slight decline in accounts receivable turnover', 'Healthy liquidity reserve buffer'],
    warnings: ['SaaS platform subscription over-allocation'],
    reasoning: ['Profit margins cover direct and indirect operation costs sustainably.']
  } : (dashboardData?.risk?.details ?? {});

  const riskDimensions = riskDetails.risk_dimensions ?? {};
  const riskSeverityBreakdown = riskDetails.severity_breakdown ?? {};
  const dominantRiskFactor = riskDetails.dominant_risk_factor ?? (isDemo ? 'Operational Overhead' : null);
  const riskConfidence = riskDetails.confidence ?? null;
  const riskSummary = riskDetails.summary ?? null;
  const riskFindings = safeArray(riskDetails.findings);
  const riskWarnings = safeArray(riskDetails.warnings);
  const riskReasoning = safeArray(riskDetails.reasoning);

  // ── Anomalies (existing + fallbacks) ────────────────────────
  const anomalyAlerts = isDemo
    ? [
        { id: 1, title: 'Unusual Marketing Spike', detail: 'March marketing expenditure was 2.4σ above baseline ($142k), likely seasonal campaign spend.', severity: 'warning', category: 'Marketing', deviation: '2.4σ' },
        { id: 2, title: 'Operational SaaS Inefficiencies', detail: 'Software subscription renewals jumped by 42% QoQ without clear seat assignment growth.', severity: 'critical', category: 'Software/SaaS', deviation: '3.1σ' },
        { id: 3, title: 'Accounts Receivable Delay', detail: 'AR collection times increased by 4.2 days, temporarily lowering free cash flow buffer.', severity: 'info', category: 'Receivables', deviation: '1.2σ' }
      ]
    : riskFlags.map((flag, i) => ({
        id: i,
        title: 'Risk Flag Detected',
        detail: flag,
        severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'critical' : 'warning',
        category: 'Risk Assessment',
        deviation: riskLevel
      }));

  const anomaliesRaw = dashboardData?.anomalies ?? {};
  const anomaliesDetailed = isDemo
    ? [
        { title: 'SaaS platform subscription over-allocation', detail: 'SaaS expenditures increased 42% without proportional headcount gains.', severity: 'CRITICAL', category: 'Software/SaaS', deviation: '3.1σ' }
      ]
    : safeArray(anomaliesRaw.anomalies_detailed ?? anomaliesRaw?.raw_data?.anomalies_detailed);
  const anomalyCount = isDemo ? 3 : (anomaliesRaw.anomaly_count ?? anomaliesDetailed.length);
  const anomalySummary = anomaliesRaw.summary ?? null;
  const anomalyConfidence = anomaliesRaw.confidence ?? null;

  // ── Recommendations (existing + fallbacks) ──────────────────
  const recommendationsText = safeArray(dashboardData?.insights?.recommendations);
  const recommendations = isDemo
    ? [
        { id: 1, action: 'Consolidate redundant SaaS subscriptions', rationale: 'Multiple teams are subscribing to overlapping communication and tracking apps, resulting in an extra $18k annual burn.', priority: 'High', impact: 'Cash Preservation', color: 'red' },
        { id: 2, action: 'Re-negotiate cloud hosting allocations', rationale: 'Review AWS/GCP unreserved instances to unlock up to 25% cost reduction in dev environments.', priority: 'Medium', impact: 'Infrastructure Margin', color: 'amber' },
        { id: 3, action: 'Implement cash reserve treasury yields', rationale: 'Deploy the $340k idle buffer into safe 5.2% yield treasuries to generate passive operational income.', priority: 'Low', impact: 'Passive Revenue', color: 'blue' }
      ]
    : recommendationsText.map((text, index) => {
        let priority = 'Low';
        let color = 'blue';
        if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('immediate')) {
          priority = 'High'; color = 'red';
        } else if (text.toLowerCase().includes('consider') || text.toLowerCase().includes('monitor')) {
          priority = 'Medium'; color = 'amber';
        }
        return {
          id: index + 1,
          action: text,
          rationale: 'Generated by AI auditor analysis based on financial patterns.',
          priority,
          impact: 'Strategic',
          color
        };
      });

  const recommendationsDetailed = (() => {
    if (isDemo) {
      return [
        { title: 'SaaS Platform Consolidation', recommendation: 'Audit SaaS stack and cancel inactive user licenses.', reasoning: 'SaaS expenditures increased 42% without proportional headcount gains.', priority: 'HIGH', impact_area: 'Operations', time_horizon: 'IMMEDIATE', expected_outcome: '$18k annual savings' },
        { title: 'Treasury Asset Management', recommendation: 'Place operational buffer in high-yield corporate cash reserves.', reasoning: '$340k idle balance losing value to inflation.', priority: 'MEDIUM', impact_area: 'Treasury', time_horizon: 'SHORT_TERM', expected_outcome: '5.2% passive yield generation' }
      ];
    }
    const raw = dashboardData;
    const p1 = raw?.recommendations_detailed;
    if (p1 && Array.isArray(p1)) return p1;
    const p2 = raw?.insights?.recommendations_detailed;
    if (p2 && Array.isArray(p2)) return p2;
    return recommendationsText.map((text, i) => {
      const lower = text.toLowerCase();
      let priority = 'LOW';
      if (lower.includes('critical') || lower.includes('immediately')) priority = 'CRITICAL';
      else if (lower.includes('urgent') || lower.includes('high') || lower.includes('preserve') || lower.includes('audit')) priority = 'HIGH';
      else if (lower.includes('consider') || lower.includes('review') || lower.includes('monitor')) priority = 'MEDIUM';
      return {
        title: `Strategic Action ${i + 1}`,
        recommendation: text,
         reasoning: 'Generated from financial pattern analysis.',
        priority,
        impact_area: 'Financial Stability',
        time_horizon: 'SHORT_TERM',
        expected_outcome: 'Improved financial discipline.',
      };
    });
  })();

  // ── Auditor / Executive Synthesis (existing + fallbacks) ─────
  const auditorRaw = dashboardData?.insights ?? {};
  const auditorSummary = isDemo
    ? 'Overall financial stability is strong with a health score of 78/100. However, minor anomalies in software SaaS spending and seasonal marketing spikes need immediate consolidation. I recommend trimming operations overhead to build a larger cash cushion for Q3 forecast expansion.'
    : (auditorRaw.summary ?? null);
  
  const auditorFull = isDemo ? {
    executive_priorities: ['SaaS Consolidation', 'AR Collection Terms Acceleration', 'Reserve Allocation Yield Optimization'],
    strategic_outlook: {
      short_term: 'Preserve cash buffer to buffer seasonal burn.',
      medium_term: 'Optimize operating cost overhead by 12%.',
      long_term: 'Expand cloud integration to automate back-office operations.'
    },
    uncertainty_level: 'MODERATE',
    uncertainty_summary: 'Slight operational volatility observed due to marketing expenditure spikes.',
    dominant_risks: ['Operations Overhead', 'Accounts Receivable Delayed Terms'],
    conflicting_signals: ['Revenue growing by 8.3% YoY while SaaS platform renewals spike 42%'],
    findings: [], warnings: [], reasoning: [], confidence: 0.85
  } : (dashboardData?.auditor ?? {});

  const executivePriorities = safeArray(
    auditorFull.executive_priorities ?? auditorFull?.raw_data?.executive_priorities
  );

  const strategicOutlook = auditorFull.strategic_outlook ?? auditorFull?.raw_data?.strategic_outlook ?? null;

  const uncertaintyLevel = auditorFull?.metadata?.uncertainty_level ?? auditorFull?.uncertainty_level ?? null;
  const uncertaintySummary = auditorFull.uncertainty_summary ?? auditorFull?.raw_data?.uncertainty_summary ?? null;

  const dominantRisks = safeArray(
    auditorFull.dominant_risks ?? auditorFull?.raw_data?.dominant_risks
  );

  const conflictingSignals = safeArray(
    auditorFull.conflicting_signals ?? auditorFull?.raw_data?.conflicting_signals
  );

  const auditorFindings = safeArray(auditorFull.findings);
  const auditorWarnings = safeArray(auditorFull.warnings);
  const auditorReasoning = safeArray(auditorFull.reasoning);
  const auditorConfidence = auditorFull.confidence ?? null;

  // ── Overall Confidence ─────────────────────────────────────
  const overallConfidence = (() => {
    const vals = [riskConfidence, anomalyConfidence, auditorConfidence].filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return isDemo ? 85 : null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
  })();

  // ── Pipeline status ────────────────────────────────────────
  const completedAgents = (() => {
    if (isDemo) return ['foundation', 'forecast_agent', 'anomaly_agent', 'health_agent', 'risk_agent', 'recommendation_agent', 'auditor_agent'];
    if (!hasData) return [];
    const completed = [];
    if (Object.keys(kpis).length > 0) completed.push('foundation');
    if (revenueTrend.length > 0 || forecastTrend.length > 0) completed.push('forecast_agent');
    const anomalyData = dashboardData?.anomalies;
    if (anomalyData && (typeof anomalyData === 'object' && Object.keys(anomalyData).length > 0)) {
      completed.push('anomaly_agent');
    }
    if (dashboardData?.health_score !== undefined && dashboardData?.health_score !== null) {
      completed.push('health_agent');
    }
    const riskData = dashboardData?.risk?.details;
    if (riskData && Object.keys(riskData).length > 0) completed.push('risk_agent');
    if (recommendationsText.length > 0) completed.push('recommendation_agent');
    if (auditorSummary) completed.push('auditor_agent');
    return completed;
  })();
  const failedAgents = [];
  const pipelineStatus = hasData
    ? (completedAgents.length >= 7 ? 'COMPLETED' : completedAgents.length > 0 ? 'PARTIAL' : 'UNKNOWN')
    : (isDemo ? 'COMPLETED' : 'NOT_STARTED');

  // ── Benchmark ──────────────────────────────────────────────
  const bData = [
    { company: 'TCS', profitMargin: 25.2, color: '#3B82F6' },
    { company: 'Infosys', profitMargin: 22.8, color: '#10B981' },
    { company: 'Wipro', profitMargin: 18.5, color: '#F59E0B' },
  ];
  const pMargin = isDemo ? '23.4' : kpis.profit_margin;
  if (pMargin) {
    bData.unshift({ company: 'Your Company', profitMargin: parseFloat(pMargin), color: '#8B5CF6' });
  }

  const hScore = isDemo ? 78 : (dashboardData?.health_score ?? 0);
  const hLabel = hScore > 80 ? 'Excellent Health' : hScore > 60 ? 'Good Health' : 'Needs Review';
  const healthScore = {
    score: hScore,
    label: hLabel,
    breakdown: [
      { name: 'Profitability Profile', score: isDemo ? 82 : (kpis.profit_margin ? Math.min(100, Math.round(parseFloat(kpis.profit_margin) * 3.2)) : 75) },
      { name: 'Stability Index', score: isDemo ? 75 : (dashboardData?.health_score ? Math.round(dashboardData.health_score * 0.95) : 80) },
      { name: 'Efficiency Ratio', score: isDemo ? 88 : (dashboardData?.charts?.expense_trend ? 85 : 70) },
      { name: 'Risk Mitigation', score: isDemo ? 70 : (riskLevel === 'LOW' ? 95 : riskLevel === 'MEDIUM' ? 75 : 45) },
    ]
  };

  const scenarioData = isDemo
    ? [
        { scenario: 'Baseline', profit: 563000 },
        { scenario: '+10% Sales', profit: 647450 },
        { scenario: '-10% Sales', profit: 478550 },
        { scenario: '+5% Margin', profit: 591150 }
      ]
    : [
        { scenario: 'Baseline', profit: kpis.profit ?? 0 },
        { scenario: '+10% Revenue', profit: (kpis.profit ?? 0) * 1.15 },
        { scenario: '-10% Revenue', profit: (kpis.profit ?? 0) * 0.85 }
      ];

  const auditorExplanation = isDemo
    ? "Overall financial stability is strong with a health score of 78/100. However, minor anomalies in software SaaS spending and seasonal marketing spikes need immediate consolidation. I recommend trimming operations overhead to build a larger cash cushion for Q3 forecast expansion."
    : (auditorSummary || null);

  const risk = isDemo 
    ? { risk_level: 'MEDIUM', risk_flags: ['Burn rate increased 8% QoQ', 'AR collection slowdown detected'] }
    : { risk_level: riskLevel, risk_flags: riskFlags };

  return {
    isReal: hasData,
    kpiCards: [],
    trendData: combinedForecast,
    forecastData: combinedForecast,
    revenueTrend,
    expenseTrend,
    forecastTrend,
    expenseData,
    anomalyAlerts,
    benchmarkData: bData,
    recommendations,
    healthScore,
    scenarioData,
    risk,
    auditorExplanation,

    // ── Orchestration ─────────────────────────────────────────
    executionGraph: EXECUTION_GRAPH,
    completedAgents,
    failedAgents,
    pipelineStatus,

    // ── Risk intelligence ─────────────────────────────────────
    riskDimensions,
    riskSeverityBreakdown,
    dominantRiskFactor,
    riskConfidence,
    riskSummary,
    riskFindings,
    riskWarnings,
    riskReasoning,

    // ── Anomaly intelligence ──────────────────────────────────
    anomaliesDetailed,
    anomalyCount,
    anomalySummary,
    anomalyConfidence,

    // ── Detailed recommendations ──────────────────────────────
    recommendationsDetailed,

    // ── Executive synthesis ───────────────────────────────────
    auditorSummary,
    auditorConfidence,
    auditorFindings,
    auditorWarnings,
    auditorReasoning,
    executivePriorities,
    strategicOutlook,
    uncertaintyLevel,
    uncertaintySummary,
    dominantRisks,
    conflictingSignals,

    // ── Overall confidence ────────────────────────────────────
    overallConfidence,
  };
};
