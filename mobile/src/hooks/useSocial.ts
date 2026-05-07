import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface Connection {
  id: number;
  user_id: number;
  connected_user_id: number;
  status: string;
  created_at: string;
  accepted_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  connected_user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: number;
  is_private: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Challenge {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  goal_type: string;
  goal_value: number;
  created_by: number;
  start_date: string;
  end_date: string;
  participant_count: number;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  level: number;
  xp: number;
  streak: number;
  rank: number;
}

export interface ActivityFeedItem {
  id: number;
  user_id: number;
  activity_type: string;
  data: string | null;
  visibility: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export function useConnections(status?: string) {
  return useQuery({
    queryKey: ['connections', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get<Connection[]>(`/social/connections${params}`);
      return data;
    },
  });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.post('/social/connections/request', {
        connected_user_id: userId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useAcceptConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: number) => {
      const { data } = await api.post(`/social/connections/${connectionId}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useRejectConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: number) => {
      const { data } = await api.post(`/social/connections/${connectionId}/reject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useRemoveConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: number) => {
      const { data } = await api.delete(`/social/connections/${connectionId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get<LeaderboardEntry[]>('/social/leaderboard');
      return data;
    },
  });
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get<ActivityFeedItem[]>('/social/feed');
      return data;
    },
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await api.get<Group[]>('/groups/');
      return data;
    },
  });
}

export function useDiscoverGroups() {
  return useQuery({
    queryKey: ['groups', 'discover'],
    queryFn: async () => {
      const { data } = await api.get<Group[]>('/groups/discover');
      return data;
    },
  });
}

export function useGroupDetail(groupId: number) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const { data } = await api.get<Group>(`/groups/${groupId}`);
      return data;
    },
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: number) {
  return useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: async () => {
      const { data } = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
      return data;
    },
    enabled: !!groupId,
  });
}

export function useGroupChallenges(groupId: number) {
  return useQuery({
    queryKey: ['groups', groupId, 'challenges'],
    queryFn: async () => {
      const { data } = await api.get<Challenge[]>(`/groups/${groupId}/challenges`);
      return data;
    },
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupData: { name: string; description?: string; is_private: boolean }) => {
      const { data } = await api.post('/groups/', groupData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: number) => {
      const { data } = await api.post(`/groups/${groupId}/join`);
      return data;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: number) => {
      const { data } = await api.post(`/groups/${groupId}/leave`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, challengeData }: {
      groupId: number;
      challengeData: {
        title: string;
        description?: string;
        goal_type: string;
        goal_value: number;
        start_date: string;
        end_date: string;
      };
    }) => {
      const { data } = await api.post(`/groups/${groupId}/challenges`, challengeData);
      return data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'challenges'] });
    },
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, challengeId }: { groupId: number; challengeId: number }) => {
      const { data } = await api.post(`/groups/${groupId}/challenges/${challengeId}/join`);
      return data;
    },
    onSuccess: (_, { groupId, challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges', challengeId, 'participants'] });
    },
  });
}
