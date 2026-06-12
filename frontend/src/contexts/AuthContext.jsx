import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '@/services/auth.service';
import { authEventBus } from '@/services/eventBus';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (tokenStorage.get()) {
        const profileData = await authService.getProfile();
        setUser(profileData);
      }
    } catch (error) {
      console.error('Failed to fetch user profile on load', error);
      // If profile fetch fails (e.g. 401 and refresh fails), we clear user state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial profile fetch
    fetchProfile();

    // Listen to global logout event from Axios interceptor
    const handleLogout = () => {
      setUser(null);
      // If you are using React Router, you can't navigate here easily without useLocation/useNavigate
      // Usually the ProtectedRoute will automatically redirect if `user` becomes null.
    };

    authEventBus.addEventListener('logout', handleLogout);

    return () => {
      authEventBus.removeEventListener('logout', handleLogout);
    };
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    // After login, we fetch the profile or use returned user data if available
    if (data.user) {
      setUser(data.user);
    } else {
      await fetchProfile();
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
