import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Build an absolute URL for media files (images, etc.).
 * - If url is already http(s)://, return as-is.
 * - If relative (e.g. /media/...), prepend the backend base so images load
 *   when the frontend is served from a different origin (e.g. localhost:3000).
 */
export const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Browsers often cannot load http://0.0.0.0:8000; replace with localhost
    if (url.includes('0.0.0.0')) return url.replace(/0\.0\.0\.0/g, 'localhost');
    return url;
  }
  const base = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:8000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors (backend not running)
    if (!error.response) {
      console.error('Network Error: Backend server is not responding. Make sure the Django server is running on http://localhost:8000');
      return Promise.reject({
        message: 'Cannot connect to server. Please make sure the backend is running.',
        isNetworkError: true
      });
    }
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('CORS Error: Check backend CORS configuration');
      return Promise.reject({
        message: 'CORS error. Please check backend configuration.',
        isCorsError: true
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
