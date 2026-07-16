/**
 * Axios API client: JWT auth, refresh, errors, and multipart-safe uploads.
 *
 * Base URL: `{REACT_APP_BACKEND_URL}/api` (default `http://localhost:8000/api`).
 * Set `REACT_APP_BACKEND_URL` at build time for production (no trailing slash).
 *
 * **FormData / file uploads:** The instance defaults to `Content-Type: application/json`.
 * For `FormData`, the request interceptor clears `Content-Type` so the browser sets
 * `multipart/form-data` with the correct boundary. Otherwise Django receives no files
 * (e.g. thread attachments). See `ThreadChat` `send_message` POST.
 */
import axios from 'axios';

/** Backend origin without trailing slash (e.g. https://api.example.com). Build-time: REACT_APP_BACKEND_URL. */
const BACKEND_ORIGIN = (
  process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'
).replace(/\/$/, '');

const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

const BACKEND_BASE_URL = BACKEND_ORIGIN;

/**
 * Build an absolute URL for media (images) when the API returns a relative `/media/...` path.
 * Fixes `0.0.0.0` hosts that browsers cannot load.
 */
export const getMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('0.0.0.0')) {
      return url.replace(/0\.0\.0\.0/g, 'localhost');
    }
    return url;
  }

  return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const path = typeof config.url === 'string' ? config.url.split('?')[0] : '';
    const method = (config.method || 'get').toLowerCase();
    const norm = path.replace(/^\/+/, '');
    const isPublicSearch = method === 'get' && (norm === 'search' || norm.startsWith('search/'));
    if (isPublicSearch) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Authorization');
      } else if (config.headers) {
        delete config.headers.Authorization;
      }
    } else {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers;
      if (h && typeof h.delete === 'function') {
        h.delete('Content-Type');
      } else if (h) {
        delete h['Content-Type'];
        delete h['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject({
        message: 'Cannot connect to server. Please make sure the backend is running.',
        isNetworkError: true,
      });
    }

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
      }
    }

    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      return Promise.reject({
        message: 'CORS error. Please check backend configuration.',
        isCorsError: true,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
