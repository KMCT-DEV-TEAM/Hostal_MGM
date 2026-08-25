import { create } from 'zustand';
import authService from '@/services/auth.service';
import { authEventBus } from '@/services/eventBus';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  authenticated: false,
  updateUser: (updatedUser) => set((state) => {
    if (!state.user && !updatedUser) return { user: null };
    const merged = { ...state.user, ...updatedUser };
    if (merged.role) {
      merged.role = merged.role.toLowerCase();
    }
    return { user: merged };
  }),

  init: async () => {
    try {
      if (tokenStorage.getAccessToken()) {
        const profile = await authService.getProfile();
        const userObj = profile.user ? {
          ...profile.user,
          role: (profile.user.role || '').toLowerCase()
        } : null;
        set({ user: userObj, authenticated: Boolean(userObj) });
      } else {
        set({ user: null, authenticated: false });
      }
    } catch {
      tokenStorage.clear();
      set({ user: null, authenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  login: async (credentials) => {
    const data = await authService.login(credentials);
    const profile = await authService.getProfile();
    set({ user: profile.user, authenticated: true });
    return data;
  },

  logout: async () => {
    try {
      const response = await authService.logout();
      console.log('logout response:', response);
    } finally {
      set({ user: null, authenticated: false });
    }
  },
}));

// Listen to global logout event from Axios interceptor
authEventBus.addEventListener('logout', () => {
  useAuthStore.setState({ user: null, authenticated: false });
});

// Initialize the store immediately
useAuthStore.getState().init();
