/**
 * auth.js — Local user store using localStorage
 * Acts as the "database" until a real backend is connected.
 * 
 * User shape: { id, name, email, password(hashed), photo, provider, createdAt }
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
const TOKEN_KEY   = 'aicfo_token';
const USER_KEY    = 'aicfo_user';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
};
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

// Very basic hash (not for production — just keeps passwords off plaintext)
const simpleHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h.toString(16);
};

// ── Session (store JWT + user) ─────────────────────────────────────────────────
export const saveAuth = (token, user) => {
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
  catch (e) { console.warn('saveAuth failed', e); }
};

export const loadAuth = () => {
  try { return { token: localStorage.getItem(TOKEN_KEY), user: JSON.parse(localStorage.getItem(USER_KEY) || 'null') }; }
  catch { return { token: null, user: null }; }
};

export const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };

// ── Register (backend) ───────────────────────────────────────────────────────
export const registerUser = async ({ name, email, password }) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: payload.detail || 'Registration failed' };
  saveAuth(payload.access_token, payload.user);
  return { success: true, user: payload.user };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  if (!email?.trim() || !password?.trim()) return { success: false, error: 'Email and password are required' };
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: payload.detail || 'Login failed' };
  saveAuth(payload.access_token, payload.user);
  return { success: true, user: payload.user };
};

// ── Google OAuth (GSI) ────────────────────────────────────────────────────────
/**
 * Decodes the JWT credential from Google response.
 * This is the user's Google profile (no extra API call needed).
 */
const decodeGoogleJWT = (credential) => {
  try {
    const base64 = credential.split('.')[1];
    const json   = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const handleGoogleCredential = async (credentialResponse) => {
  // For now decode the Google JWT client-side and send to backend in future.
  const payload = decodeGoogleJWT(credentialResponse.credential);
  if (!payload) return { success: false, error: 'Invalid Google token' };
  // Attempt to register/login via backend using email; backend social login not implemented yet.
  const { name, email, picture } = payload;
  // Try login; if fails, return user info for client-side flow.
  return { success: false, error: 'Google sign-in not wired to backend yet', user: { name, email, photo: picture } };
};

// ── Google Client ID ──────────────────────────────────────────────────────────
// Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable real Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? null;
