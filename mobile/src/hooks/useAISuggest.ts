import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/features/tasks/api';

export function useAISuggest(title: string, description: string) {
  const q = title.trim();
  return useQuery({
    queryKey: ['ai-suggest', q, description],
    queryFn: async () => (await tasksApi.suggestTasks(q, description.trim() || undefined)).data,
    enabled: q.length > 2,
    staleTime: 60_000,
  });
}
