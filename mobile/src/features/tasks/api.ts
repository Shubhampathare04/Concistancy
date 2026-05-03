import { api } from '@/services/api';
import { TaskCreate, TaskUpdate } from './types';

export const tasksApi = {
  getAll: (page = 1, pageSize = 20) =>
    api.get('/tasks/', { params: { page, page_size: pageSize } }),

  create: (data: TaskCreate) =>
    api.post('/tasks/', data),

  update: (taskId: number, data: TaskUpdate) =>
    api.patch(`/tasks/${taskId}`, data),

  delete: (taskId: number) =>
    api.delete(`/tasks/${taskId}`),

  complete: (taskId: number, idempotencyKey: string, durationMinutes?: number) =>
    api.post(`/tasks/${taskId}/complete`, {
      idempotency_key: idempotencyKey,
      duration_minutes: durationMinutes ?? null,
    }),

  syncBatch: (actions: any[]) =>
    api.post('/tasks/sync/batch', { actions }),

  getDashboard: () =>
    api.get('/stats/dashboard'),

  getConsistencyReport: () =>
    api.get('/stats/consistency'),

  getBehaviorScores: () =>
    api.get('/stats/behavior-scores'),

  getWeeklyTrend: (weeks = 8) =>
    api.get('/stats/weekly-trend', { params: { weeks } }),

  getRank: () =>
    api.get('/stats/rank'),

  getWeeklyReport: () =>
    api.get('/ai/weekly-report'),

  suggestTasks: (title: string, description?: string) =>
    api.post('/ai/suggest', { title, description }),

  // Focus mode endpoints
  focusStart: (taskId: number) => 
    api.post(`/ai/focus-start/${taskId}`),
  
  focusEnd: (taskId: number) => 
    api.post(`/ai/focus-end/${taskId}`),
  
  // Search endpoint
  search: (q: string) => 
    api.get('/stats/search', { params: { q } }),
};

export const habitsApi = {
  list:   ()                          => api.get('/habits/'),
  create: (data: any)                 => api.post('/habits/', data),
  delete: (id: number)                => api.delete(`/habits/${id}`),
  log:    (id: number, note = '')     => api.post(`/habits/${id}/log`, null, { params: { note } }),
  logs:   (id: number)                => api.get(`/habits/${id}/logs`),
};

export const eventsApi = {
  list:        ()           => api.get('/events/'),
  join:        (id: number) => api.post(`/events/${id}/join`),
  complete:    (id: number) => api.post(`/events/${id}/complete`),
  leaderboard: (id: number) => api.get(`/events/${id}/leaderboard`),
};

export const socialApi = {
  follow:      (id: number)                  => api.post(`/social/follow/${id}`),
  unfollow:    (id: number)                  => api.delete(`/social/follow/${id}`),
  feed:        ()                            => api.get('/social/feed'),
  leaderboard: (by = 'xp')                   => api.get('/social/leaderboard', { params: { by } }),
  search:      (q: string)                   => api.get('/social/search', { params: { q } }),
  profile:     (id: number)                  => api.get(`/social/users/${id}`),
  messages:    (otherId: number)             => api.get(`/social/messages/${otherId}`),
  sendMessage: (otherId: number, content: string) => api.post(`/social/messages/${otherId}`, { content }),
};

export const professionalsApi = {
  list:            ()           => api.get('/professionals/'),
  register:        (data: any)  => api.post('/professionals/register', data),
  book:            (data: any)  => api.post('/professionals/consultations', data),
  myConsultations: ()           => api.get('/professionals/consultations'),
};

export const subscriptionsApi = {
  status:      ()            => api.get('/subscriptions/status'),
  subscribe:   (plan: string) => api.post('/subscriptions/subscribe', { plan }),
  renew:       ()            => api.post('/subscriptions/renew'),
  freezeStreak: ()           => api.post('/subscriptions/freeze-streak'),
};

export const authApi = {
  me:           ()            => api.get('/auth/me'),
  registerFCM:  (token: string, platform = 'expo') =>
    api.post('/auth/fcm-token', { token, platform }),
  onboard: (data: { goal: string; starter_task_titles: string[]; reminder_hour: number }) =>
    api.post('/auth/onboard', data),
  streakRecovery: () => api.get('/auth/streak-recovery'),
};

export const moodApi = {
  log:    (mood: number, energy: number, task_id?: number) => api.post('/mood/', { mood, energy, task_id }),
  recent: ()                                               => api.get('/mood/recent'),
  trend:  ()                                               => api.get('/mood/trend'),
};

export const statsApi = {
  personalRecords:      ()                          => api.get('/stats/personal-records'),
  consistencyHistory:   (days = 30)                 => api.get('/stats/consistency-history', { params: { days } }),
  xpMultiplier:         ()                          => api.get('/stats/xp-multiplier'),
  rival:                ()                          => api.get('/stats/rival'),
  setRival:             (id: number)                => api.post(`/stats/rival/${id}`),
  removeRival:          ()                          => api.delete('/stats/rival'),
  search:               (q: string)                 => api.get('/stats/search', { params: { q } }),
  setReminder:          (taskId: number, data: any) => api.post(`/stats/tasks/${taskId}/reminder`, data),
  deleteReminder:       (taskId: number)            => api.delete(`/stats/tasks/${taskId}/reminder`),
};

