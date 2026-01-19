import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.expertsec.in/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to handle tokens automatically for future requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;