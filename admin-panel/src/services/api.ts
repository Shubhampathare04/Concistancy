import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Auth
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),
  
  getMe: () => api.get('/admin/me'),

  // Users
  getUsers: (params: any) => api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: any) => api.patch(`/admin/users/${id}`, data),
  banUser: (id: number, reason: string) => api.post(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id: number) => api.post(`/admin/users/${id}/unban`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Analytics
  getOverview: () => api.get('/admin/analytics/overview'),
  getUserGrowth: (days: number) => api.get('/admin/analytics/users', { params: { days } }),
  getTaskAnalytics: () => api.get('/admin/analytics/tasks'),
  getStreakDistribution: () => api.get('/admin/analytics/streaks'),

  // Tasks & Activity
  getTasks: (params: any) => api.get('/admin/tasks', { params }),
  getActivityLogs: (params: any) => api.get('/admin/activity-logs', { params }),

  // Subscriptions
  getSubscriptions: (params: any) => api.get('/admin/subscriptions', { params }),
  createSubscription: (data: any) => api.post('/admin/subscriptions', data),
  updateSubscription: (id: number, data: any) => api.patch(`/admin/subscriptions/${id}`, data),

  // Payments
  getPayments: (params: any) => api.get('/admin/payments', { params }),

  // System
  getSystemHealth: () => api.get('/admin/system/health'),
  getSystemMetrics: () => api.get('/admin/system/metrics')
};
