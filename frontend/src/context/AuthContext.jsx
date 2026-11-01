import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  // restore the session from a saved token
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => handleAuth((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => handleAuth((await api.post('/auth/register', { name, email, password })).data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  // re-fetch the user so the balance in the navbar is always fresh after a trade
  const refreshUser = useCallback(async () => setUser((await api.get('/auth/me')).data.user), []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
