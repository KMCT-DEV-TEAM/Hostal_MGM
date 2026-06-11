import authApi from '@/features/auth/api/authApi';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';

/**
 * Performs login, stores the returned tokens in storage, and returns the response payload data.
 * @param {Object} credentials - adminId/email and password
 * @returns {Promise<Object>} response data containing user and tokens
 */
export async function login(credentials) {
  const response = await authApi.login(credentials);
  const data = response.data;

  if (data) {
    if (data.accessToken) {
      tokenStorage.set(data.accessToken);
    }
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
  }

  return data;
}

/**
 * Request verification OTP code for resetting password.
 * @param {Object} payload - email address
 */
export function forgotPassword(payload) {
  return authApi.forgotPassword(payload);
}

/**
 * Verify the OTP code sent to user email.
 * @param {Object} payload - OTP details
 */
export function verifyOtp(payload) {
  return authApi.verifyOtp(payload);
}

/**
 * Submit new password using verified OTP.
 * @param {Object} payload - password details
 */
export function resetPassword(payload) {
  return authApi.resetPassword(payload);
}

/**
 * Check if user is authenticated (access token is present).
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!tokenStorage.get();
}

/**
 * Log out and clear stored tokens.
 */
export function logout() {
  tokenStorage.clear();
}

const authService = {
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  isAuthenticated,
  logout,
};

export default authService;