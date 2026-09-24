import axios from 'axios';

// Vite only exposes frontend environment variables prefixed with VITE_.
// In production, set VITE_API_URL in Vercel to:
// https://lesson-plan-app-67or.onrender.com/api
const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://lesson-plan-app-67or.onrender.com/api'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
});

// Attach the JWT to every request once the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, send the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
