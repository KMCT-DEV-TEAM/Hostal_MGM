import axios from 'axios';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';
import { ApiError } from '@/services/apiError';

// Get base URL from environment variables, fallback to localhost:3001
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach authentication token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to refresh access token
const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Use raw axios instance to prevent interceptor loops/recursion
  const response = await axios.post(`${baseURL}/auth/refresh`, { token: refreshToken });
  const { accessToken } = response.data;

  if (accessToken) {
    tokenStorage.set(accessToken);
  } else {
    throw new Error('Refresh token request failed to return an access token');
  }

  return accessToken;
};

// Response Interceptor: Format successful responses and handle standard API errors
apiClient.interceptors.response.use(
  (response) => {
    // Return full response instead of just response.data
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    // Handle 401 Unauthorized errors and attempt silent token refresh
    if (response && response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        
        // Retry original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid; clear credentials and throw expiration error
        tokenStorage.clear();

        throw new ApiError({
          message: 'Session expired. Please log in again.',
          status: 401,
          code: 'SESSION_EXPIRED',
          data: response.data,
        });
      }
    }

    // Process and throw structured API Errors
    if (response) {
      const message = response.data?.message || response.data?.error || 'An unexpected error occurred.';
      const status = response.status;
      const code = response.data?.code || null;
      const data = response.data || null;

      throw new ApiError({
        message,
        status,
        code,
        data,
      });
    } else if (error.request) {
      // The request was made but no response was received (network issue)
      throw new ApiError({
        message: 'Network error. Please check your connection.',
        status: null,
        code: 'NETWORK_ERROR',
        data: null,
      });
    } else {
      throw new ApiError({
        message: error.message,
        status: null,
        code: 'REQUEST_SETUP_ERROR',
        data: null,
      });
    }
  }
);

export default apiClient;
