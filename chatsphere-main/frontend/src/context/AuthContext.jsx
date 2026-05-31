import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const userIdRef = useRef(null);

  useEffect(() => {
    userIdRef.current = user?.id ? Number(user.id) : null;
  }, [user?.id]);

  const handleAccountStatusChange = (payload) => {
    const payloadUserId = Number(payload?.userId || payload?.user?.id);
    const currentUserId = userIdRef.current;

    console.debug('[auth][status-change]', {
      currentUserId,
      payloadUserId,
      status: payload?.status || null,
      message: payload?.message || null
    });

    if (!payload || payload.status === 'approved') return;

    if (!currentUserId || !payloadUserId || payloadUserId !== currentUserId) {
      console.debug('[auth][status-change] ignored for non-current user');
      return;
    }

    toast.error(payload.message || 'Your account status changed');
    logout(false);
  };

  const syncSocketSession = (nextToken) => {
    const socket = getSocket();
    socket.auth = { token: nextToken };
    socket.off('account:status-changed', handleAccountStatusChange);
    socket.on('account:status-changed', handleAccountStatusChange);
    console.debug('[auth][socket] session synced', {
      hasToken: !!nextToken,
      socketConnected: !!socket.connected,
      socketActive: !!socket.active
    });
  };

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

        localStorage.setItem(
          storageKeys.user,
          JSON.stringify(data.user)
        );

        syncSocketSession(storedToken);
      } catch (err) {
        logout(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  /**
   * =========================
   * SAVE LOGIN STATE
   * =========================
   */
  const persistAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);

    localStorage.setItem(storageKeys.token, nextToken);
    localStorage.setItem('token', nextToken);
    localStorage.setItem(
      storageKeys.user,
      JSON.stringify(nextUser)
    );

    syncSocketSession(nextToken);
  };

  /**
   * =========================
   * LOGIN
   * =========================
   */
  const login = async (payload) => {
    setAuthBusy(true);

    try {
      const { data } = await api.post('/auth/login', payload);
      persistAuth(data.token, data.user);

      toast.success('Welcome back');
      return data;
    } finally {
      setAuthBusy(false);
    }
  };

  /**
   * =========================
   * REGISTER
   * =========================
   */
  const register = async (payload) => {
    setAuthBusy(true);

    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } finally {
      setAuthBusy(false);
    }
  };

  const adminLogin = async (payload) => {
    setAuthBusy(true);

    try {
      const { data } = await api.post('/admin/login', payload);
      persistAuth(data.token, data.user);

      toast.success('Admin access granted');
      return data;
    } finally {
      setAuthBusy(false);
    }
  };

  /**
   * =========================
   * LOGOUT
   * =========================
   */
  const logout = (showToast = true) => {
    console.debug('[auth][logout]', {
      showToast,
      currentUserId: userIdRef.current,
      hasToken: !!token,
      hasUser: !!user
    });

    setToken(null);
    setUser(null);

    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem('token');

    disconnectSocket();

    if (showToast) toast.success('Logged out');
  };

  /**
   * =========================
   * CONTEXT VALUE
   * =========================
   */
  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
      loading,
      authBusy,
      login,
      adminLogin,
      register,
      logout
    }),
    [user, token, loading, authBusy]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);