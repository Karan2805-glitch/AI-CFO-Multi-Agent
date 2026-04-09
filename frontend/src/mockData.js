// ─── KPI Summary ──────────────────────────────────────────────────────────────
export const kpiData = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: 12500000,
    formatted: '$12.5M',
    delta: '+8.2%',
    deltaPositive: true,
    sub: 'vs last quarter',
    color: 'blue',
    icon: 'DollarSign',
  },
  {
    id: 'expenses',
    label: 'Total Expenses',
    value: 8500000,
    formatted: '$8.5M',
    delta: '+12.4%',
    deltaPositive: false,
    sub: 'vs last quarter',
    color: 'red',
    icon: 'TrendingDown',
  },
  {
    id: 'profit',
    label: 'Net Profit',
    value: 4000000,
    formatted: '$4.0M',
    delta: '-2.1%',
    deltaPositive: false,
    sub: 'vs last quarter',
    color: 'green',
    icon: 'BarChart2',
  },
  {
    id: 'margin',
    label: 'Profit Margin',
    value: 32,
    formatted: '32%',
    delta: '+0.5%',
    deltaPositive: true,
    sub: 'vs peer avg 28.5%',
    color: 'purple',
    icon: 'Activity',
  },
];

// ─── Normalization Layer ───────────────────────────────────────────────────────
export const normalizationData = {
  profit_margin:   0.32,
  expense_ratio:   0.68,
  salary_ratio:    0.285,
  marketing_ratio: 0.136,
};

// ─── Revenue vs Expense Trend ─────────────────────────────────────────────────
export const trendData = [
  { month: 'Jan', revenue: 950000,  expenses: 650000 },
  { month: 'Feb', revenue: 1050000, expenses: 680000 },
  { month: 'Mar', revenue: 1100000, expenses: 950000 }, // anomaly spike
  { month: 'Apr', revenue: 1020000, expenses: 720000 },
  { month: 'May', revenue: 1150000, expenses: 750000 },
  { month: 'Jun', revenue: 1250000, expenses: 800000 },
  { month: 'Jul', revenue: 1300000, expenses: 820000 },
  { month: 'Aug', revenue: 1350000, expenses: 850000 },
  { month: 'Sep', revenue: 1400000, expenses: 880000 },
  { month: 'Oct', revenue: 1380000, expenses: 900000 },
  { month: 'Nov', revenue: 1450000, expenses: 910000 },
  { month: 'Dec', revenue: 1500000, expenses: 940000 },
];

// ─── Forecast (Linear regression) ─────────────────────────────────────────────
export const forecastData = [
  { month: 'Jan',  revenue: 950000  },
  { month: 'Feb',  revenue: 1050000 },
  { month: 'Mar',  revenue: 1100000 },
  { month: 'Apr',  revenue: 1020000 },
  { month: 'May',  revenue: 1150000 },
  { month: 'Jun',  revenue: 1250000 },
  { month: 'Jul',  revenue: 1300000 },
  { month: 'Aug',  revenue: 1350000 },
  { month: 'Sep',  revenue: 1400000 },
  { month: 'Oct',  revenue: 1380000 },
  { month: 'Nov',  revenue: 1450000 },
  { month: 'Dec',  revenue: 1500000 },
  { month: 'Jan+', forecast: 1580000 },
  { month: 'Feb+', forecast: 1650000 },
  { month: 'Mar+', forecast: 1720000 },
];

// ─── Expense Breakdown ─────────────────────────────────────────────────────────
export const expenseData = [
  { name: 'Salaries',      value: 3570000, pct: 42, color: '#3B82F6' },
  { name: 'Marketing',     value: 1700000, pct: 20, color: '#F43F5E' },
  { name: 'Rent',          value: 1275000, pct: 15, color: '#8B5CF6' },
  { name: 'Subscriptions', value:  850000, pct: 10, color: '#F59E0B' },
  { name: 'Utilities',     value:  425000, pct:  5, color: '#14B8A6' },
  { name: 'Others',        value:  680000, pct:  8, color: '#94A3B8' },
];

// ─── Anomaly Alerts ────────────────────────────────────────────────────────────
export const anomalyAlerts = [
  {
    id: 1,
    severity: 'critical',
    category: 'Marketing',
    title: 'Marketing Spike Detected',
    detail: 'March marketing spend ($950k) exceeded mean + 2σ threshold ($782k). This is an anomaly.',
    deviation: '+2.4σ',
  },
  {
    id: 2,
    severity: 'warning',
    category: 'Salaries',
    title: 'Salary Cost Rising Steadily',
    detail: 'Salary ratio has grown from 26% → 28.5% over 6 months. Approaching risk threshold.',
    deviation: '+2.5%',
  },
  {
    id: 3,
    severity: 'info',
    category: 'Subscriptions',
    title: 'Subscriptions Unusually High',
    detail: 'Subscription cost exceeds TCS and Infosys peer median by 18%. Review for overlap.',
    deviation: '+18%',
  },
];

// ─── Benchmark Data ────────────────────────────────────────────────────────────
export const benchmarkData = [
  { company: 'Your Company', profitMargin: 32, expenseRatio: 68, salaryRatio: 28.5, color: '#3B82F6' },
  { company: 'TCS',          profitMargin: 28, expenseRatio: 72, salaryRatio: 30.0, color: '#8B5CF6' },
  { company: 'Infosys',      profitMargin: 35, expenseRatio: 65, salaryRatio: 26.0, color: '#10B981' },
  { company: 'Wipro',        profitMargin: 25, expenseRatio: 75, salaryRatio: 32.0, color: '#F59E0B' },
];

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendations = [
  {
    id: 1,
    priority: 'High',
    action: 'Reduce Marketing Spend by 15%',
    rationale: 'Marketing ratio (13.6%) exceeds industry norm. A 15% trim brings projected profit to $4.25M.',
    impact: '+$255k profit',
    color: 'red',
  },
  {
    id: 2,
    priority: 'High',
    action: 'Optimize Subscription Stack',
    rationale: 'Subscription cost is 18% above peer median. 4 tools show overlapping utility — consolidate.',
    impact: '+$153k savings',
    color: 'amber',
  },
  {
    id: 3,
    priority: 'Medium',
    action: 'Review Workforce Cost Structure',
    rationale: 'Salary ratio (28.5%) is rising. Consider contractor-to-fulltime mix optimization.',
    impact: 'Long-term stability',
    color: 'blue',
  },
  {
    id: 4,
    priority: 'Medium',
    action: 'Improve Efficiency vs Infosys',
    rationale: 'Infosys profit margin (35%) > yours (32%). Operational improvements can close gap.',
    impact: '+3% target margin',
    color: 'purple',
  },
];

// ─── Health Score ──────────────────────────────────────────────────────────────
export const healthScore = {
  score: 78,
  label: 'Stable',
  breakdown: [
    { name: 'Profit Margin',       score: 82 },
    { name: 'Expense Ratio',       score: 74 },
    { name: 'Cost Distribution',   score: 79 },
    { name: 'Peer Benchmark',      score: 76 },
  ],
};

// ─── Scenario Analysis ────────────────────────────────────────────────────────
export const scenarioData = [
  { scenario: 'Base Case',        profit: 4000000, label: 'Current' },
  { scenario: 'Marketing -15%',   profit: 4255000, label: '+$255k' },
  { scenario: 'Expenses -10%',    profit: 4850000, label: '+$850k' },
  { scenario: 'Revenue +10%',     profit: 5250000, label: '+$1.25M' },
  { scenario: 'Marketing +10%',   profit: 3830000, label: '-$170k' },
];
