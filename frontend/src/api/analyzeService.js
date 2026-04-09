/**
 * analyzeService.js
 *
 * Sends the CSV to the backend /api/analyze endpoint.
 * Persists the result to localStorage so data survives page refreshes.
 *
 * STORAGE KEY: 'aicfo_analysis'
 */

const API_BASE = 'http://localhost:8000';
const STORAGE_KEY = 'aicfo_analysis';

// ── Required columns the backend expects ─────────────────────────────────────
const REQUIRED_NUMERIC_COLS = ['revenue', 'rent', 'salaries', 'marketing', 'subscriptions', 'utilities', 'other'];
// Aliases that will be auto-renamed to 'months' (the backend's expected key)
const DATE_COL_ALIASES = ['months', 'date', 'month', 'period', 'time', 'year_month'];

/**
 * Reads the CSV client-side, normalises header names, auto-renames a date
 * column to 'months' if needed, and validates that all required columns are
 * present.  Returns a cleaned File object ready for the backend.
 *
 * @param {File} file — original CSV File from the input
 * @returns {Promise<File>} — cleaned File (or rejects with a user-friendly message)
 */
const preprocessCSVFile = async (file) => {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error('The CSV file appears to be empty or has no data rows.');
  }

  // Normalise headers: lowercase + trim + strip surrounding quotes
  const rawHeaders = lines[0].split(',');
  const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  // Find the date/period column (any recognised alias)
  const dateCol = DATE_COL_ALIASES.find((a) => headers.includes(a));

  // Validate required numeric columns
  const missing = REQUIRED_NUMERIC_COLS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missing.join(', ')}.\n` +
      `Expected columns: months, revenue, rent, salaries, marketing, subscriptions, utilities, other`
    );
  }

  // If no date column at all, synthesise a 'months' column (1, 2, 3, …)
  if (!dateCol) {
    const newHeaders = ['months', ...headers].join(',');
    const newBody = lines
      .slice(1)
      .map((line, i) => `${i + 1},${line}`)
      .join('\n');
    const newText = `${newHeaders}\n${newBody}`;
    return new File([newText], file.name, { type: 'text/csv' });
  }

  // If the date column is already 'months' nothing to change
  if (dateCol === 'months') return file;

  // Rename the date alias → 'months'
  const fixedHeaders = headers.map((h) => (h === dateCol ? 'months' : h)).join(',');
  const newText = [fixedHeaders, ...lines.slice(1)].join('\n');
  return new File([newText], file.name, { type: 'text/csv' });
};

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
  // ── Step 0: client-side CSV pre-processing ───────────────────────────────
  onStep(0);
  const cleanedFile = await preprocessCSVFile(file); // throws on bad CSV

  const formData = new FormData();
  formData.append('file', cleanedFile);

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
