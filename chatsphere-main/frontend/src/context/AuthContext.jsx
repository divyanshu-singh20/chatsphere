import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { disconnectSocket, getSocket } from '../services/socket';

const AuthContext = createContext(null);

const storageKeys = {
  token: 'chatsphere_token',
  user: 'chatsphere_user'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem(storageKeys.user);
    return cached ? JSON.parse(cached) : null;
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem(storageKeys.token)
  );

  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [accessNotice, setAccessNotice] = useState(null);

  const clearStoredAuth = useCallback(() => {
    setToken(null);
    setUser(null);

    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem('token');

    disconnectSocket();
  }, []);

  const logout = useCallback((showToast = true, options = {}) => {
    const { preserveAccessNotice = false } = options;
    clearStoredAuth();

    if (!preserveAccessNotice) {
      setAccessNotice(null);
    }

    if (showToast) toast.success('Logged out');
  }, [clearStoredAuth]);

  const bindForceLogoutListener = useCallback((socket) => {
    if (!socket) return;

    const handleForceLogout = (payload = {}) => {
      const nextNotice = {
        status: 'blocked',
        message: payload.message || 'Your account has been blocked by an admin.'
      };

      setAccessNotice(nextNotice);
      logout(false, { preserveAccessNotice: true });
    };

    socket.off('force-logout', handleForceLogout);
    socket.on('force-logout', handleForceLogout);
  }, [logout]);

  /**
   * =========================
   * VERIFY USER ON LOAD
   * =========================
   */
  useEffect(() => {
    const storedToken =
      token ||
      localStorage.getItem(storageKeys.token) ||
      localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get('/auth/me'); // backend: /api/auth/me
        setUser(data.user);
        setAccessNotice(null);

        localStorage.setItem(
          storageKeys.user,
          JSON.stringify(data.user)
        );

        const socket = getSocket();
        socket.auth = { token: storedToken };
        bindForceLogoutListener(socket);

        if (!socket.connected) socket.connect();
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || '';

        if (status === 403 && /waiting for admin approval/i.test(message)) {
          setAccessNotice({ status: 'pending', message });
          logout(false, { preserveAccessNotice: true });
        } else if (status === 403 && /blocked by admin/i.test(message)) {
          setAccessNotice({ status: 'blocked', message });
          logout(false, { preserveAccessNotice: true });
        } else {
          logout(false);
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [bindForceLogoutListener, logout, token]);

  /**
   * =========================
   * SAVE LOGIN STATE
   * =========================
   */
  const persistAuth = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAccessNotice(null);

    localStorage.setItem(storageKeys.token, nextToken);
    localStorage.setItem('token', nextToken);
    localStorage.setItem(
      storageKeys.user,
      JSON.stringify(nextUser)
    );

    const socket = getSocket();
    socket.auth = { token: nextToken };
    bindForceLogoutListener(socket);

    if (!socket.connected) socket.connect();
  }, [bindForceLogoutListener]);

  /**
   * =========================
   * LOGIN
   * =========================
   */
  const login = useCallback(async (payload) => {
    setAuthBusy(true);

    try {
      const { data } = await api.post('/auth/login', payload);
      persistAuth(data.token, data.user);

      toast.success('Welcome back');
      return data;
    } finally {
      setAuthBusy(false);
    }
  }, [persistAuth]);

  /**
   * =========================
   * REGISTER
   * =========================
   */
  const register = useCallback(async (payload) => {
    setAuthBusy(true);

    try {
      const { data } = await api.post('/auth/register', payload);
      setAccessNotice(null);

      toast.success(data?.message || 'Account created');
      return data;
    } finally {
      setAuthBusy(false);
    }
  }, []);

  /**
   * =========================
   * LOGOUT
   * =========================
   */
  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
      loading,
      authBusy,
      accessNotice,
      login,
      register,
      logout
    }),
    [user, token, loading, authBusy, accessNotice, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);