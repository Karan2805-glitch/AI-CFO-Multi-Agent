/**
 * analyzeService.js
 * 
 * Sends the CSV to the backend /api/analyze endpoint.
 * Persists the result to localStorage so data survives page refreshes
 * (until a real DB is wired up).
 * 
 * STORAGE KEY: 'aicfo_analysis'
 */

const API_BASE = 'http://localhost:8000';
const STORAGE_KEY = 'aicfo_analysis';

// ── Save / Load from localStorage ────────────────────────────────────────────
export const saveAnalysis = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
};

export const loadAnalysis = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const clearAnalysis = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ── POST CSV → backend ────────────────────────────────────────────────────────
/**
 * @param {File} file  — the CSV File object from the input
 * @param {Function} onStep — called with step index (0-5) as pipeline progresses
 * @returns {Promise<Object>} — the full `data` object from the backend
 */
export const analyzeCSV = async (file, onStep) => {
  const formData = new FormData();
  formData.append('file', file);

  // Step 0 — uploading
  onStep(0);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  // Step 1 — preprocessing (server returned)
  onStep(1);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Server error ${response.status}`);
  }

  const json = await response.json();

  // Simulate steps 2-4 with small delays for UX (pipeline already ran server-side)
  await delay(400); onStep(2); // normalizing
  await delay(400); onStep(3); // running agents
  await delay(400); onStep(4); // generating insights
  await delay(300); onStep(5); // done

  const analysisData = json.data;

  // Persist to localStorage
  saveAnalysis(analysisData);

  return analysisData;
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
