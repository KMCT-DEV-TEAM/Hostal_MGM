import api from '@/services/axios';

const authApi = {
  login: (payload) =>
    api.post("/auth/login", payload),

  forgotPassword: (payload) =>
    api.post("/auth/forgot-password", payload),

  verifyOtp: (payload) =>
    api.post("/auth/verify-otp", payload),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload),

  getProfile: () =>
    api.get("/auth/me"),
};

export default authApi;
