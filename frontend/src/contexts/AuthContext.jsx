import {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';

import authService from '@/services/auth.service';
import { authEventBus } from '@/services/eventBus';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (tokenStorage.getAccessToken()) {
          const profile = await authService.getProfile();

          if (mounted) setUser(profile);
        }
      } catch {
        tokenStorage.clear();

        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const handleLogout = () => setUser(null);

    authEventBus.addEventListener('logout', handleLogout);

    return () => {
      mounted = false;
      authEventBus.removeEventListener('logout', handleLogout);
    };
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);

    const profile = await authService.getProfile();
    setUser(profile);

    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      authenticated: !!user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}