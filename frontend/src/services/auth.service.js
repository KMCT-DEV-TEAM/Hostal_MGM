import authApi from '@/features/auth/api/authApi';

const TOKEN_KEY = 'auth_token';

const authService = {
  /**
   * Performs login and stores the returned token.
   * @param {Object} credentials - adminId/email and password
   * @returns {Promise<Object>} user data and response
   */
  async login(credentials) {
    const response = await authApi.login(credentials);
    if (response && response.token) {
      this.setToken(response.token);
    }
    return response;
  },

  /**
   * Request verification OTP code for resetting password.
   * @param {Object} payload - email address
   */
  forgotPassword(payload) {
    return authApi.forgotPassword(payload);
  },

  /**
   * Verify the OTP code sent to user email.
   * @param {Object} payload - OTP details
   */
  verifyOtp(payload) {
    return authApi.verifyOtp(payload);
  },

  /**
   * Submit new password using verified OTP.
   * @param {Object} payload - password details
   */
  resetPassword(payload) {
    return authApi.resetPassword(payload);
  },

  /**
   * Store JWT authentication token in local storage.
   * @param {string} token 
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Retrieve stored JWT token.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Remove stored JWT token from local storage.
   */
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if token is present (authenticated status).
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;
