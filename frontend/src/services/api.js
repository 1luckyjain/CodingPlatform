import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// =============================================
//  AUTH API
// =============================================
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// =============================================
//  PROBLEMS API
// =============================================
export const problemsAPI = {
    getAll: (params) => api.get('/problems', { params }),
    getById: (id) => api.get(`/problems/${id}`),
    create: (data) => api.post('/problems', data),
    update: (id, data) => api.put(`/problems/${id}`, data),
    delete: (id) => api.delete(`/problems/${id}`),
    getMyProblems: () => api.get('/problems/host/my-problems'),
};

// =============================================
//  SUBMISSIONS API
// =============================================
export const submissionsAPI = {
    submit: (data) => api.post('/submissions', data),
    run: (data) => api.post('/submissions/run', data),
    getMy: (params) => api.get('/submissions/my', { params }),
    getById: (id) => api.get(`/submissions/${id}`),
};

// =============================================
//  CONTESTS API
// =============================================
export const contestsAPI = {
    getAll: (params) => api.get('/contests', { params }),
    getById: (id) => api.get(`/contests/${id}`),
    create: (data) => api.post('/contests', data),
    update: (id, data) => api.put(`/contests/${id}`, data),
    delete: (id) => api.delete(`/contests/${id}`),
    join: (id) => api.post(`/contests/${id}/join`),
    getLeaderboard: (id) => api.get(`/contests/${id}/leaderboard`),
    getMyContests: () => api.get('/contests/host/my-contests'),
};

// =============================================
//  ANALYTICS API
// =============================================
export const analyticsAPI = {
    getOverview: () => api.get('/analytics/overview'),
    getDailySubmissions: (days) => api.get('/analytics/submissions/daily', { params: { days } }),
    getDifficultyDistribution: () => api.get('/analytics/problems/difficulty'),
    getHostAnalytics: () => api.get('/analytics/host'),
    getGlobalLeaderboard: () => api.get('/analytics/leaderboard'),
};

export default api;
