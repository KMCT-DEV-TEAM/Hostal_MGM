import axios from 'axios';
import { tokenStorage } from '@/features/auth/storage/tokenStorage';
import { ApiError } from '@/services/apiError';
import { authEventBus } from '@/services/eventBus';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// REFRESH TOKEN
const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }


  const response = await axios.post(
    `${baseURL}/auth/refresh`,
    {
      token: refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );


  const { accessToken } = response.data;


  if (!accessToken) {
    throw new Error('No access token returned');
  }


  tokenStorage.set(accessToken);

  return accessToken;
};


let isRefreshing = false;
let failedQueue = [];


const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};



// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },


  async (error) => {

    const originalRequest = error.config;
    const response = error.response;


    if (!response) {
      throw new ApiError({
        message: 'Network error. Please check your connection.',
        status: null,
        code: 'NETWORK_ERROR',
        data: null,
      });
    }



    const url = originalRequest?.url || '';

    const isLoginRequest =
      url.includes('/auth/login');

    const isRefreshRequest =
      url.includes('/auth/refresh');



    // IMPORTANT: Do NOT refresh on login failure
    if (
      response.status === 401 &&
      !originalRequest._retry &&
      !isLoginRequest &&
      !isRefreshRequest
    ) {


      if (isRefreshing) {

        return new Promise((resolve, reject) => {

          failedQueue.push({
            resolve,
            reject,
          });

        })
          .then((token) => {

            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            return apiClient(originalRequest);

          })
          .catch((err) => {

            return Promise.reject(err);

          });

      }



      originalRequest._retry = true;
      isRefreshing = true;



      try {

        const newToken = await refreshAccessToken();


        processQueue(
          null,
          newToken
        );


        originalRequest.headers.Authorization =
          `Bearer ${newToken}`;


        return apiClient(originalRequest);


      } catch (refreshError) {


        processQueue(
          refreshError,
          null
        );


        tokenStorage.clear();


        authEventBus.dispatchEvent(
          new Event('logout')
        );


        throw new ApiError({
          message:
            'Session expired. Please log in again.',
          status: 401,
          code: 'SESSION_EXPIRED',
          data: response.data,
        });


      } finally {

        isRefreshing = false;

      }

    }


    console.log('response error:', response)
    // Normal API errors

    const message =
      response.data?.message ||
      response.data?.error ||
      'An unexpected error occurred';



    throw new ApiError({

      message,

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