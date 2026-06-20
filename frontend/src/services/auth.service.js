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

  if (data?.accessToken) {
    tokenStorage.setAccessToken(data.accessToken);
  }

  return data;
}

/**
 * Request OTP code for resetting password.
 * @param {Object} payload - email address
 */
export function sendOtp(payload) {
  return authApi.sendOtp(payload);
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
 * Change temporary password.
 * @param {Object} payload - oldPassword and newPassword
 */
export function changePassword(payload) {
  return authApi.changePassword(payload);
}

/**
 * Log out and clear stored tokens.
 */
export async function logout() {
  try {
    // Assuming authApi.logout() exists. If not, this is a placeholder.
    if (authApi.logout) {
      await authApi.logout();
    }
  } catch (error) {
    console.error("Logout API failed", error);
  } finally {
    tokenStorage.clear();
  }
}

/**
 * Fetches the currently authenticated user's profile info.
 */
export async function getProfile() {
  const response = await authApi.getProfile();
  return response.data;
}

/**
 * Update the authenticated user's profile.
 * @param {Object} payload - profile data to update
 * @returns {Promise<Object>} updated user data
 */
export async function updateProfile(payload) {
  const response = await authApi.updateProfile(payload);
  return response.data;
}

const authService = {
  login,
  sendOtp,
  verifyOtp,
  resetPassword,
  changePassword,
  logout,
  getProfile,
  updateProfile,
};

export default authService;