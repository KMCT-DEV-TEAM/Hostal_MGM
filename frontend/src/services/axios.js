import axios from 'axios';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';
import { ApiError } from '@/services/apiError';
import { authEventBus } from '@/services/eventBus';

const baseURL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001';

/*
|--------------------------------------------------------------------------
| MAIN API CLIENT
|--------------------------------------------------------------------------
*/

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/*
|--------------------------------------------------------------------------
| REFRESH CLIENT (NO INTERCEPTORS)
|--------------------------------------------------------------------------
*/

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

/*
|--------------------------------------------------------------------------
| TOKEN REFRESH STATE
|--------------------------------------------------------------------------
*/

const refreshState = {
  refreshing: false,
  queue: [],
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function processQueue(error, token = null) {
  refreshState.queue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });

  refreshState.queue = [];
}

function clearSession() {
  tokenStorage.clear();
  authEventBus.dispatchEvent(new Event('logout'));
}

/*
|--------------------------------------------------------------------------
| REFRESH ACCESS TOKEN
|--------------------------------------------------------------------------
*/

async function refreshAccessToken() {
  const response = await refreshClient.post('/auth/refresh');

  const accessToken =
    response.data?.data?.accessToken;

  if (!accessToken) {
    clearSession();
    throw new Error('Invalid refresh response');
  }

  tokenStorage.setAccessToken(accessToken);

  return accessToken;
}

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

apiClient.interceptors.request.use(
  (config) => {
    const token =
      tokenStorage.getAccessToken();

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },

  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const response = error.response;
    const originalRequest = error.config;

    if (!response) {
      throw new ApiError({
        message:
          'Network error. Please check your connection.',
        status: null,
        code: 'NETWORK_ERROR',
        data: null,
      });
    }

    const url =
      originalRequest?.url || '';

    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh');

    const shouldRefresh =
      response.status === 401 &&
      (
        response.data?.code === 'TOKEN_EXPIRED' ||
        !response.data?.code
      );

    if (
      shouldRefresh &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (refreshState.refreshing) {
        return new Promise((resolve, reject) => {
          refreshState.queue.push({
            resolve,
            reject,
          });
        }).then((newToken) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };

          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      refreshState.refreshing = true;

      try {
        const newToken =
          await refreshAccessToken();

        processQueue(null, newToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError);

        clearSession();

        throw new ApiError({
          message:
            'Session expired. Please log in again.',
          status: 401,
          code: 'SESSION_EXPIRED',
          data: response.data,
        });

      } finally {
        refreshState.refreshing = false;
      }
    }

    throw new ApiError({
      message:
        response.data?.message ||
        response.data?.error ||
        'Unexpected error',

      status: response.status,

      code:
        response.data?.code ||
        null,

      data:
        response.data ||
        null,
    });
  }
);

export default apiClient;