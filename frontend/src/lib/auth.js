/**
 * auth.js — Local user store using localStorage
 * Acts as the "database" until a real backend is connected.
 * 
 * User shape: { id, name, email, password(hashed), photo, provider, createdAt }
 */

const USERS_KEY   = 'aicfo_users';
const SESSION_KEY = 'aicfo_session';

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

// ── Session ───────────────────────────────────────────────────────────────────
export const saveSession = (user) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

export const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
};

export const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

// ── Register ──────────────────────────────────────────────────────────────────
/**
 * @returns {{ success, user, error }}
 */
export const registerUser = ({ name, email, password }) => {
  if (!name?.trim() || !email?.trim() || !password?.trim())
    return { success: false, error: 'All fields are required' };

  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
    return { success: false, error: 'An account with this email already exists' };

  const user = {
    id:        `u_${Date.now()}`,
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    password:  simpleHash(password),
    photo:     null,
    provider:  'email',
    isNew:     true,
    createdAt: new Date().toISOString(),
  };

  setUsers([...users, user]);
  const { password: _, ...safeUser } = user; // never expose hash
  saveSession(safeUser);
  return { success: true, user: safeUser };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = ({ email, password }) => {
  if (!email?.trim() || !password?.trim())
    return { success: false, error: 'Email and password are required' };

  const users = getUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() &&
           u.provider === 'email'
  );

  if (!found)   return { success: false, error: 'No account found with this email' };
  if (found.password !== simpleHash(password))
    return { success: false, error: 'Incorrect password' };

  const { password: _, ...safeUser } = found;
  const sessionUser = { ...safeUser, isNew: false };
  saveSession(sessionUser);
  return { success: true, user: sessionUser };
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

export const handleGoogleCredential = (credentialResponse) => {
  const payload = decodeGoogleJWT(credentialResponse.credential);
  if (!payload) return { success: false, error: 'Invalid Google token' };

  const { name, email, picture, sub } = payload;
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    // Returning Google user
    const { password: _, ...safeUser } = existing;
    const sessionUser = { ...safeUser, isNew: false, provider: 'google' };
    saveSession(sessionUser);
    return { success: true, user: sessionUser };
  }

  // New Google user — register them
  const user = {
    id:        `g_${sub}`,
    name,
    email:     email.toLowerCase(),
    photo:     picture ?? null,
    provider:  'google',
    isNew:     true,
    createdAt: new Date().toISOString(),
  };
  setUsers([...users, user]);
  saveSession(user);
  return { success: true, user };
};

// ── Google Client ID ──────────────────────────────────────────────────────────
// Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable real Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? null;
