// ==============================================================================
// APEX PERFORMANCE — AUTH CONTEXT (SESSION STATE FOR THE WHOLE APP)
// File Path: client/src/context/AuthContext.jsx
// Provides: user, isLoading, isAuthenticated, login, register, logout
// ==============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  ApiRequestError,
  AUTH_EXPIRED_EVENT,
  clearToken,
  getToken,
  setToken
} from '../services/api.js';

const AuthContext = createContext(null);

/**
 * Helper: make sure the server's login/register response has the shape we rely on.
 */
const requireSession = (data) => {
  if (!data?.token || !data?.user) {
    throw new ApiRequestError('Unexpected response from the server. Please try again.', 0);
  }
  return data;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // If a token is saved we must verify it before deciding what to show, so start in "loading"
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));

  // 1. Restore the session on first load by asking the server who the token belongs to
  useEffect(() => {
    if (!getToken()) {
      return undefined;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const data = await api.get('/auth/me');
        if (!cancelled) setUser(data?.user ?? null);
      } catch {
        // A 401 already cleared the token inside api.js; other failures just leave us logged out
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. If any request later discovers the token is invalid/expired, log out immediately
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  // 3. Actions exposed to the rest of the app. Errors are thrown so forms can display them.
  const login = useCallback(async (email, password) => {
    // auth: false -> a wrong password must not be mistaken for an expired session
    const data = requireSession(await api.post('/auth/login', { email, password }, { auth: false }));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = requireSession(await api.post('/auth/register', { name, email, password }, { auth: false }));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook so components write `const { user } = useAuth()` instead of touching the context directly
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}