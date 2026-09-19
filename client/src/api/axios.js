import axios from 'axios';

const getBaseURL = () => {
  let url = (import.meta.env.VITE_API_URL || '/api').trim();
  url = url.replace(/\/+$/, ''); // Remove trailing slashes
  // If it's an absolute URL and doesn't end with /api, append /api
  if (url.startsWith('http') && !url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('webhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('webhub_token');
      localStorage.removeItem('webhub_user');
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
