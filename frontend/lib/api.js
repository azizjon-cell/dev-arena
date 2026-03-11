/**
 * API Client - Axios instance с interceptors
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавляет токен
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - обрабатывает ошибки
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истёк или недействителен
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateSettings: (data) => api.put('/users/settings', data),
  getUser: (id) => api.get(`/users/${id}`),
};

// Challenges API
export const challengesAPI = {
  getAll: (params) => api.get('/challenges', { params }),
  getOne: (slug) => api.get(`/challenges/${slug}`),
  submit: (id, code) => api.post(`/challenges/${id}/submit`, { code }),
  getHints: (id, index) => api.get(`/challenges/${id}/hints`, { params: { index } }),
  getDaily: () => api.get('/challenges/daily'),
};

// Battles API
export const battlesAPI = {
  create: (difficulty) => api.post('/battles/create', { difficulty }),
  join: (battleId) => api.post('/battles/join', { battleId }),
  getBattle: (battleId) => api.get(`/battles/${battleId}`),
  getStatus: (battleId) => api.get(`/battles/${battleId}/status`),
  submitCode: (battleId, code, finished) => 
    api.post(`/battles/${battleId}/submit`, { code, finished }),
  getAvailable: () => api.get('/battles'),
};

// Learning API
export const learningAPI = {
  getCategories: () => api.get('/learning/categories'),
  getTopics: (params) => api.get('/learning/topics', { params }),
  getTopic: (slug) => api.get(`/learning/topics/${slug}`),
  getTopicContent: (slug) => api.get(`/learning/topics/${slug}/content`),
};

// Leaderboard API
export const leaderboardAPI = {
  getGlobal: (limit) => api.get('/leaderboard', { params: { limit } }),
  getWeekly: (limit) => api.get('/leaderboard/weekly', { params: { limit } }),
  getWins: (limit) => api.get('/leaderboard/wins', { params: { limit } }),
  getStreaks: (limit) => api.get('/leaderboard/streaks', { params: { limit } }),
};

export default api;
