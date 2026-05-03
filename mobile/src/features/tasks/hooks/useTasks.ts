import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api';
import { TaskCreate, TaskUpdate, Dashboard, CompleteTaskResult } from '../types';
import { generateIdempotencyKey, queueAction, cacheCompletion } from '@/db/localDB';
import NetInfo from '@react-native-community/netinfo';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await tasksApi.getDashboard()).data as Dashboard,
    staleTime: 1000 * 60,
    retry: 2,
  });

export const useTasks = (page = 1) =>
  useQuery({
    queryKey: ['tasks', page],
    queryFn: async () => (await tasksApi.getAll(page)).data,
    staleTime: 1000 * 60 * 5,
  });

export const useWeeklyTrend = (weeks = 8) =>
  useQuery({
    queryKey: ['weekly-trend', weeks],
    queryFn: async () => (await tasksApi.getWeeklyTrend(weeks)).data,
    staleTime: 1000 * 60 * 10,
  });

export const useRank = () =>
  useQuery({
    queryKey: ['rank'],
    queryFn: async () => (await tasksApi.getRank()).data,
    staleTime: 1000 * 60 * 5,
  });

export const useWeeklyReport = () =>
  useQuery({
    queryKey: ['weekly-report'],
    queryFn: async () => (await tasksApi.getWeeklyReport()).data,
    staleTime: 1000 * 60 * 60,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.create(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['dashboard'] });
      const prev = qc.getQueryData<Dashboard>(['dashboard']);
      if (prev) {
        const tempTask = {
          id: -1,
          title: data.title,
          description: data.description ?? null,
          difficulty: data.difficulty,
          estimated_minutes: data.estimated_minutes ?? null,
          schedule_type: data.schedule_type,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData(['dashboard'], { ...prev, tasks: [tempTask, ...prev.tasks] });
      }
      return { prev };
    },
    onError: (_err: unknown, _data: TaskCreate, ctx: { prev?: Dashboard } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['dashboard'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  type Vars = { taskId: number; data: TaskUpdate };
  return useMutation<unknown, Error, Vars, { prev?: Dashboard }>({
    mutationFn: ({ taskId, data }: Vars) =>
      tasksApi.update(taskId, data),
    onMutate: async ({ taskId, data }: Vars) => {
      await qc.cancelQueries({ queryKey: ['dashboard'] });
      const prev = qc.getQueryData<Dashboard>(['dashboard']);
      if (prev) {
        qc.setQueryData(['dashboard'], {
          ...prev,
          tasks: prev.tasks.map((t) => t.id === taskId ? { ...t, ...data } : t),
        });
      }
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev?: Dashboard } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['dashboard'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onMutate: async (taskId: number) => {
      await qc.cancelQueries({ queryKey: ['dashboard'] });
      const prev = qc.getQueryData<Dashboard>(['dashboard']);
      if (prev) {
        qc.setQueryData(['dashboard'], {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        });
      }
      return { prev };
    },
    onError: (_err: unknown, _taskId: number, ctx: { prev?: Dashboard } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['dashboard'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCompleteTask = () => {
  const qc = useQueryClient();

  return useMutation<
    CompleteTaskResult,
    Error,
    { taskId: number; durationMinutes?: number },
    { prev?: Dashboard }
  >({
    mutationFn: async ({ taskId, durationMinutes }) => {
      const idempotencyKey = generateIdempotencyKey();
      const net = await NetInfo.fetch();

      if (!net.isConnected) {
        await queueAction('complete_task', { task_id: taskId, duration_minutes: durationMinutes });
        await cacheCompletion(taskId, idempotencyKey);
        return {
          status: 'queued',
          xp_gained: 0,
          new_streak: 0,
          new_xp: 0,
          new_level: 1,
          consistency_index: 0,
          level_up: false,
        };
      }

      const res = await tasksApi.complete(taskId, idempotencyKey, durationMinutes);
      return res.data as CompleteTaskResult;
    },

    onMutate: async ({ taskId }) => {
      await qc.cancelQueries({ queryKey: ['dashboard'] });
      const prev = qc.getQueryData<Dashboard>(['dashboard']);
      if (prev) {
        const task = prev.tasks.find((t) => t.id === taskId);
        const estimatedXp = task ? task.difficulty * 10 : 10;
        qc.setQueryData<Dashboard>(['dashboard'], {
          ...prev,
          tasks:             prev.tasks.filter((t) => t.id !== taskId),
          streak:            prev.streak + 1,
          xp:                prev.xp + estimatedXp,
          total_completions: prev.total_completions + 1,
        });
      }
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['dashboard'], ctx.prev);
    },

    onSuccess: (data) => {
      if (data.status === 'queued') return;
      const current = qc.getQueryData<Dashboard>(['dashboard']);
      if (current) {
        qc.setQueryData<Dashboard>(['dashboard'], {
          ...current,
          streak:            data.new_streak,
          xp:                data.new_xp,
          level:             data.new_level,
          consistency_index: data.consistency_index,
        });
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
