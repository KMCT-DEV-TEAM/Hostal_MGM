import axios from 'axios';

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
    // Get token from local storage (or another preferred storage mechanism)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format successful responses and handle standard API errors
apiClient.interceptors.response.use(
  (response) => {
    // Standard response structure extracts the data directly
    return response.data;
  },
  (error) => {
    // Handle specific status codes
    const response = error.response;
    const customError = {
      message: 'An unexpected error occurred.',
      status: response ? response.status : null,
      data: response ? response.data : null,
    };

    if (response) {
      // Extract backend-specific error message if available
      customError.message = response.data?.message || response.data?.error || customError.message;

      switch (response.status) {
        case 401:
          // Global Action: Unauthorized access (e.g., token expired).
          // Trigger logout or redirection here.
          localStorage.removeItem('auth_token');
          // Optionally trigger event, or window.location.href redirect if needed.
          break;
        case 403:
          customError.message = 'Forbidden: You do not have permission to perform this action.';
          break;
        case 404:
          customError.message = 'Requested resource not found.';
          break;
        case 500:
          customError.message = 'Internal server error. Please try again later.';
          break;
        default:
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received (network issue)
      customError.message = 'Network error. Please check your connection.';
    } else {
      customError.message = error.message;
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
