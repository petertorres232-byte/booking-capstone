// ==============================================================================
// APEX PERFORMANCE — CENTRAL API CLIENT
// File Path: client/src/services/api.js
// The ONLY place the React app calls fetch(). Pages/components import { api }.
// ==============================================================================

const TOKEN_KEY = 'apex_token';
const DEFAULT_TIMEOUT_MS = 15000;

// Fired when the server rejects a stored token; AuthContext listens for it (Step 27)
export const AUTH_EXPIRED_EVENT = 'auth:expired';

// ---------- Token storage helpers (localStorage can throw in private/blocked modes) ----------
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the user stays logged in only until the page reloads
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear if storage is unavailable
  }
};

// ---------- Error type ----------
/**
 * status 0  = no response (offline, timeout, misconfiguration)
 * status >0 = HTTP status returned by the server
 * data      = parsed JSON body when available (e.g. AI fallback hints)
 */
export class ApiRequestError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

// ---------- Internal helpers ----------
const getBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_BASE_URL;
  if (!rawUrl) {
    throw new ApiRequestError('The app is missing its API address configuration (VITE_API_BASE_URL).');
  }
  return rawUrl.replace(/\/+$/, ''); // Remove trailing slashes
};

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null; // Non-JSON body (e.g. a proxy error page)
  }
};

const defaultMessageForStatus = (status) => {
  if (status === 401) return 'Please log in to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our server. Please try again.';
  return 'The request could not be completed.';
};

const request = async (path, { method = 'GET', body, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = { Accept: 'application/json' };
  const token = auth ? getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let data;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    data = await parseBody(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiRequestError('The server took too long to respond. Please try again.', 0);
    }
    throw new ApiRequestError('Cannot reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // A rejected token means the session is over: clear it and tell the app
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const message =
      typeof data?.message === 'string' && data.message ? data.message : defaultMessageForStatus(response.status);
    throw new ApiRequestError(message, response.status, data);
  }

  return data;
};

// ---------- Public API ----------
export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};