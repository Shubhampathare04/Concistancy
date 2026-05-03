import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../services/api';

// ─── Groups ──────────────────────────────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getGroups,
  });
}

export function useGroupDetail(groupId: number) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getGroupDetail(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => groupsApi.joinGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });
}

export function useLeaveGroup(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => groupsApi.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useGroupMessages(groupId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['group', groupId, 'messages'],
    queryFn: () => groupsApi.getMessages(groupId),
    enabled: enabled && !!groupId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useSendMessage(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => groupsApi.sendMessage(groupId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'messages'] });
    },
  });
}

export function useReactToMessage(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      groupsApi.reactToMessage(groupId, messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'messages'] });
    },
  });
}

// ─── Challenges ──────────────────────────────────────────────────────────────

export function useGroupChallenges(groupId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['group', groupId, 'challenges'],
    queryFn: () => groupsApi.getChallenges(groupId),
    enabled: enabled && !!groupId,
  });
}

export function useCreateChallenge(groupId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => groupsApi.createChallenge(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'challenges'] });
    },
  });
}

// ─── Members ─────────────────────────────────────────────────────────────────

export function useGroupMembers(groupId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: enabled && !!groupId,
  });
}
