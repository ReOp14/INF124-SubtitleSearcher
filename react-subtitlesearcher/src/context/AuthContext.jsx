import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'subtitleSearcherAuth';
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

async function authRequest(path, { token, body, method = 'GET' } = {}) {
  const response = await fetch(`/api/auth${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.detail || response.statusText || 'Authentication request failed');
  }

  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [loading, setLoading] = useState(() => Boolean(readStoredSession()));

  const persistSession = useCallback((nextSession) => {
    setSession(nextSession);
    if (nextSession?.token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authRequest('/login', {
      method: 'POST',
      body: { email, password },
    });
    persistSession({ user: data.user, token: data.token });
    return data;
  }, [persistSession]);

  const signup = useCallback(async ({ username, email, password }) => {
    const data = await authRequest('/signup', {
      method: 'POST',
      body: { username, email, password },
    });
    persistSession({ user: data.user, token: data.token });
    return data;
  }, [persistSession]);

  const logout = useCallback(async () => {
    const token = session?.token;
    persistSession(null);
    if (token) {
      try {
        await authRequest('/logout', { method: 'POST', token });
      } catch {
        // Local logout should still complete if the server token is already expired.
      }
    }
  }, [persistSession, session?.token]);

  const refreshProfile = useCallback(async () => {
    if (!session?.token) return null;
    const user = await authRequest('/profile', { token: session.token });
    persistSession({ token: session.token, user });
    return user;
  }, [persistSession, session?.token]);

  useEffect(() => {
    let mounted = true;

    async function validateStoredSession() {
      if (!session?.token) {
        setLoading(false);
        return;
      }

      try {
        const user = await authRequest('/profile', { token: session.token });
        if (mounted) persistSession({ token: session.token, user });
      } catch {
        if (mounted) persistSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    validateStoredSession();
    return () => {
      mounted = false;
    };
  }, [persistSession, session?.token]);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || '',
    loading,
    isAuthenticated: Boolean(session?.token),
    login,
    signup,
    logout,
    refreshProfile,
  }), [loading, login, logout, refreshProfile, session?.token, session?.user, signup]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
