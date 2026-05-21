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
  const kpis = dashboardData?.kpis ?? {};

  // ── Charts (existing) ──────────────────────────────────────
  const revenueTrend = safeArray(dashboardData?.charts?.revenue_trend);
  const forecastTrend = safeArray(dashboardData?.charts?.forecast);
  const expenseTrend = safeArray(dashboardData?.charts?.expense_trend);

  const combinedForecast = [
    ...revenueTrend.map((v, i) => ({
      month: v.month || `P${i + 1}`,
      revenue: v.revenue ?? v,
      expenses: expenseTrend[i] ?? 0,
    })),
    ...forecastTrend.map((v, i) => ({
      month: v.month || `P${revenueTrend.length + i + 1}`,
      forecast: v.revenue ?? v.forecast ?? v,
    })),
  ];

  const expensesObj = dashboardData?.charts?.expense_breakdown ?? {};
  const totalExp = Object.values(expensesObj).reduce((sum, val) => sum + (val || 0), 0);
  const expenseData = Object.entries(expensesObj).map(([name, value], i) => ({
    name,
    value,
    pct: totalExp > 0 ? ((value / totalExp) * 100).toFixed(1) : 0,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  // ── Risk (existing + enhanced) ─────────────────────────────
  const riskLevel = dashboardData?.risk?.level ?? 'UNKNOWN';
  const riskFlags = safeArray(dashboardData?.risk?.details?.risk_flags);
  const riskDetails = dashboardData?.risk?.details ?? {};
  const riskDimensions = riskDetails.risk_dimensions ?? {};
  const riskSeverityBreakdown = riskDetails.severity_breakdown ?? {};
  const dominantRiskFactor = riskDetails.dominant_risk_factor ?? null;
  const riskConfidence = riskDetails.confidence ?? null;
  const riskSummary = riskDetails.summary ?? null;
  const riskFindings = safeArray(riskDetails.findings);
  const riskWarnings = safeArray(riskDetails.warnings);
  const riskReasoning = safeArray(riskDetails.reasoning);

  // ── Anomalies (existing + enhanced) ────────────────────────
  const anomalyAlerts = riskFlags.map((flag, i) => ({
    id: i,
    title: 'Risk Flag Detected',
    detail: flag,
    severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'critical' : 'warning',
    category: 'Risk Assessment',
    deviation: riskLevel
  }));

  const anomaliesRaw = dashboardData?.anomalies ?? {};
  const anomaliesDetailed = safeArray(
    anomaliesRaw.anomalies_detailed ?? anomaliesRaw?.raw_data?.anomalies_detailed
  );
  const anomalyCount = anomaliesRaw.anomaly_count ?? anomaliesDetailed.length;
  const anomalySummary = anomaliesRaw.summary ?? null;
  const anomalyConfidence = anomaliesRaw.confidence ?? null;

  // ── Recommendations (existing + detailed) ──────────────────
  const recommendationsText = safeArray(dashboardData?.insights?.recommendations);
  const recommendations = recommendationsText.map((text, index) => {
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

  // Detailed recommendations from the raw recommendation agent output
  // Stored at result.recommendations.recommendations_detailed by compress_result + flatten_agent_response
  const recResult = dashboardData?.insights ?? {};
  // The full result JSON stored in the DB has result.recommendations which contains the detailed array
  // Through the results route, we get insights.recommendations (flat) but we can try to access
  // the detailed version from the raw stored result
  const recommendationsDetailed = (() => {
    // Try multiple access paths since the data may be structured differently
    const raw = dashboardData;
    // Path 1: Direct from a richer results response
    const p1 = raw?.recommendations_detailed;
    if (p1 && Array.isArray(p1)) return p1;
    // Path 2: Through the risk.details pattern (some agents nested)
    const p2 = raw?.insights?.recommendations_detailed;
    if (p2 && Array.isArray(p2)) return p2;
    // Fallback: transform the text recommendations into structured format
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

  // ── Auditor / Executive Synthesis ──────────────────────────
  const auditorRaw = dashboardData?.insights ?? {};
  const auditorSummary = auditorRaw.summary ?? null;
  
  // Access the full auditor agent output — may be stored at different paths
  // The compress_result stores result.auditor which the results route returns
  // We need to check all possible paths
  const auditorFull = (() => {
    // In the results route, auditor data is spread across locations
    const raw = dashboardData;
    // The auditor object itself from compress_result
    const auditorObj = raw?.auditor ?? {};
    return auditorObj;
  })();

  // Executive priorities from auditor
  const executivePriorities = safeArray(
    auditorFull.executive_priorities ?? auditorFull?.raw_data?.executive_priorities
  );

  // Strategic outlook from auditor
  const strategicOutlook = auditorFull.strategic_outlook ?? auditorFull?.raw_data?.strategic_outlook ?? null;

  // Uncertainty
  const uncertaintyLevel = auditorFull?.metadata?.uncertainty_level ?? auditorFull?.uncertainty_level ?? null;
  const uncertaintySummary = auditorFull.uncertainty_summary ?? auditorFull?.raw_data?.uncertainty_summary ?? null;

  // Dominant risks (from auditor synthesis, not raw risk agent)
  const dominantRisks = safeArray(
    auditorFull.dominant_risks ?? auditorFull?.raw_data?.dominant_risks
  );

  // Conflicting signals
  const conflictingSignals = safeArray(
    auditorFull.conflicting_signals ?? auditorFull?.raw_data?.conflicting_signals
  );

  // Auditor findings, warnings, reasoning
  const auditorFindings = safeArray(auditorFull.findings);
  const auditorWarnings = safeArray(auditorFull.warnings);
  const auditorReasoning = safeArray(auditorFull.reasoning);
  const auditorConfidence = auditorFull.confidence ?? null;

  // ── Overall Confidence ─────────────────────────────────────
  const overallConfidence = (() => {
    const vals = [riskConfidence, anomalyConfidence, auditorConfidence].filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
  })();

  // ── Pipeline status (INFERRED from data presence) ─────────
  // The backend results route does NOT return completed_agents / failed_agents
  // (those are LangGraph runtime state, not persisted to DB).
  // We infer agent completion from the presence of their output data.
  const completedAgents = (() => {
    if (!hasData) return [];
    const completed = [];
    // Foundation — if KPIs exist, foundation ran
    if (Object.keys(kpis).length > 0) completed.push('foundation');
    // Fan-out agents — check their output data
    if (revenueTrend.length > 0 || forecastTrend.length > 0) completed.push('forecast_agent');
    const anomalyData = dashboardData?.anomalies;
    if (anomalyData && (typeof anomalyData === 'object' && Object.keys(anomalyData).length > 0)) {
      completed.push('anomaly_agent');
    }
    if (dashboardData?.health_score !== undefined && dashboardData?.health_score !== null) {
      completed.push('health_agent');
    }
    // Synthesis agents — check their output data
    const riskData = dashboardData?.risk?.details;
    if (riskData && Object.keys(riskData).length > 0) completed.push('risk_agent');
    if (recommendationsText.length > 0) completed.push('recommendation_agent');
    // Executive — check auditor summary
    if (auditorSummary) completed.push('auditor_agent');
    return completed;
  })();
  const failedAgents = []; // No way to infer failure from stored results
  const pipelineStatus = hasData
    ? (completedAgents.length >= 7 ? 'COMPLETED' : completedAgents.length > 0 ? 'PARTIAL' : 'UNKNOWN')
    : 'NOT_STARTED';

  // ── Benchmark (kept for backward compat) ───────────────────
  const bData = [
    { company: 'TCS', profitMargin: 25.2, color: '#3B82F6' },
    { company: 'Infosys', profitMargin: 22.8, color: '#10B981' },
    { company: 'Wipro', profitMargin: 18.5, color: '#F59E0B' },
  ];
  if (kpis.profit_margin) {
    bData.unshift({ company: 'Your Company', profitMargin: parseFloat(kpis.profit_margin), color: '#8B5CF6' });
  }

  return {
    // Existing (backward compatible)
    isReal: hasData,
    kpiCards: [],
    trendData: combinedForecast,
    forecastData: combinedForecast,
    expenseData,
    anomalyAlerts,
    benchmarkData: bData,
    recommendations,
    healthScore: { score: dashboardData?.health_score ?? 0, label: 'Financial Health', breakdown: [] },
    scenarioData: [
      { scenario: 'Current', profit: kpis.profit ?? 0 },
      { scenario: '+10% Revenue', profit: (kpis.profit ?? 0) * 1.15 },
      { scenario: '-10% Revenue', profit: (kpis.profit ?? 0) * 0.85 }
    ],
    risk: { risk_level: riskLevel, risk_flags: riskFlags },
    auditorExplanation: auditorSummary,

    // ── NEW: Orchestration ────────────────────────────────────
    executionGraph: EXECUTION_GRAPH,
    completedAgents,
    failedAgents,
    pipelineStatus,

    // ── NEW: Risk intelligence ────────────────────────────────
    riskDimensions,
    riskSeverityBreakdown,
    dominantRiskFactor,
    riskConfidence,
    riskSummary,
    riskFindings,
    riskWarnings,
    riskReasoning,

    // ── NEW: Anomaly intelligence ─────────────────────────────
    anomaliesDetailed,
    anomalyCount,
    anomalySummary,
    anomalyConfidence,

    // ── NEW: Detailed recommendations ─────────────────────────
    recommendationsDetailed,

    // ── NEW: Executive synthesis ──────────────────────────────
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

    // ── NEW: Overall confidence ──────────────────────────────
    overallConfidence,
  };
};
