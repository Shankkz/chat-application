import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const client = axios.create({ baseURL: API_URL });

// Inject token from sessionStorage on every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('chatToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
