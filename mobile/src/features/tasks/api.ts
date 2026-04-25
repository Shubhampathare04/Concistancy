import { api } from '@/services/api';
import { TaskCreate } from './types';

export const tasksApi = {
  getAll: () => api.get('/tasks'),
  create: (data: TaskCreate) => api.post('/tasks', data),
  complete: (taskId: number) => api.post(`/tasks/${taskId}/complete`),
  getDashboard: () => api.get('/stats/dashboard'),
};
