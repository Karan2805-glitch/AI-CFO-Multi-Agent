const API_BASE = 'http://localhost:8000';
const STORAGE_KEY = 'aicfo_dashboard_state';

const parseJson = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status})`);
  }
  return payload;
};

export const saveDashboardState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('localStorage save failed:', error);
  }
};

export const loadDashboardState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearDashboardState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const startSession = async (sessionPayload) => {
  const response = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionPayload),
  });
  return parseJson(response);
};

export const analyzeWithSession = async (file, sessionId) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/analyze/analyze?session_id=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    body: formData,
  });
  return parseJson(response);
};

export const fetchResults = async (runId) => {
  const response = await fetch(`${API_BASE}/results/${encodeURIComponent(runId)}`);
  return parseJson(response);
};

export const runDashboardFlow = async ({ file, sessionPayload, onStep }) => {
  onStep?.(0);
  const sessionRes = await startSession(sessionPayload);
  const sessionId = sessionRes.session_id;
  if (!sessionId) throw new Error('Missing session_id from /session/start');

  onStep?.(1);
  const analyzeRes = await analyzeWithSession(file, sessionId);
  const runId = analyzeRes.run_id;
  if (!runId) throw new Error('Missing run_id from /analyze');

  onStep?.(2);
  const resultsRes = await fetchResults(runId);
  onStep?.(3);

  const dashboardData = resultsRes.data ?? resultsRes;
  const state = { sessionId, runId, dashboardData };
  saveDashboardState(state);
  return state;
};
