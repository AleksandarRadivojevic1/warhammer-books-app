import { createContext, useState, useEffect } from 'react';
import client, { setAccessToken } from '../api/client';

export const AuthContext = createContext(null);

// Decode the JWT payload without a library — we only need id/email/role.
// The refresh endpoint returns only a new accessToken, not the full user object,
// so we extract the user info from the token itself.
function parseToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function getCsrfToken() {
  return (
    localStorage.getItem('csrfToken') ||
    document.cookie.split('; ').find((c) => c.startsWith('csrfToken='))?.split('=')[1]
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try a silent refresh to restore the session.
  // The csrfToken cookie only exists if the user previously logged in,
  // so we skip the network call entirely if it's absent.
  useEffect(() => {
    const csrfToken = getCsrfToken();

    if (!csrfToken) {
      setLoading(false);
      return;
    }

    client
      .post('/api/auth/refresh', {}, { headers: { 'x-csrf-token': csrfToken } })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        setUser(parseToken(data.accessToken));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // The axios interceptor dispatches this event when a refresh attempt fails,
  // so we clear user state without the context needing to know about axios.
  useEffect(() => {
    const handler = () => { setUser(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const register = async (email, password) => {
    await client.post('/api/auth/register', { email, password });
  };

  const login = async (email, password) => {
    const { data } = await client.post('/api/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    if (data.csrfToken) localStorage.setItem('csrfToken', data.csrfToken);
    return data.user;
  };

  const logout = async () => {
    await client.post('/api/auth/logout');
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('csrfToken');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
