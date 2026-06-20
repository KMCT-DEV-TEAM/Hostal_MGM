import { logout } from '@/services/auth.service';
import api from '@/services/axios';

const authApi = {
  login: (payload) =>
    api.post("/auth/login", payload),

  sendOtp: (payload) =>
    api.post("/auth/forgot-password", payload),

  verifyOtp: (payload) =>
    api.post("/auth/verify-reset-otp", payload),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload),

  changePassword: (payload) =>
    api.post("/auth/change-password", payload),

  getProfile: () =>
    api.get("/auth/me"),

  updateProfile: (payload) =>
    api.patch("/auth/profile", payload),

  logout: () => api.post("/auth/logout"),
};

export default authApi;
