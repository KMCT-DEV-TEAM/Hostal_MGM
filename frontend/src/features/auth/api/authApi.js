import { logout } from '@/services/auth.service';
import api from '@/services/axios';

const authApi = {
  login: (payload) =>
    api.post("/auth/login", payload),

  sendOtp: (payload) =>
    api.post("/otp/send", payload),

  verifyOtp: (payload) =>
    api.post("/otp/verify", payload),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload),

  changePassword: (payload) =>
    api.post("/auth/change-password", payload),

  getProfile: () =>
    api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),
};

export default authApi;
