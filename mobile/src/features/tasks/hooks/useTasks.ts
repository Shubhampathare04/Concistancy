import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api';
import { TaskCreate } from '../types';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await tasksApi.getDashboard()).data,
  });

export const useTasks = () =>
  useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await tasksApi.getAll()).data,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'dashboard'] }),
  });
};

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.complete(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'dashboard'] }),
  });
};
