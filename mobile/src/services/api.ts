import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';

const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const envAndroidBaseUrl = process.env.EXPO_PUBLIC_API_URL_ANDROID?.trim();
const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const fallbackBaseUrl = `http://${defaultHost}:8000/api/v1`;
const resolvedBaseUrl =
  Platform.OS === 'android'
    ? (envAndroidBaseUrl && envAndroidBaseUrl.length > 0 ? envAndroidBaseUrl : (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : fallbackBaseUrl))
    : (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : fallbackBaseUrl);

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 10000,
});

// ─── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — handle 401 + token refresh ───────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${resolvedBaseUrl}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        const newToken = res.data.access_token;
        const newRefresh = res.data.refresh_token;
        useAuthStore.getState().setToken(newToken, newRefresh);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Stats API ────────────────────────────────────────────────────────────────
export const statsApi = {
  getDashboard: async () => {
    const { data } = await api.get('/stats/dashboard');
    return data;
  },
};

// ─── Groups API ───────────────────────────────────────────────────────────────
export const groupsApi = {
  getGroups: async () => {
    const { data } = await api.get('/groups/');
    return data;
  },
  discoverGroups: async () => {
    const { data } = await api.get('/groups/discover');
    return data;
  },
  getGroupDetail: async (groupId: number) => {
    const { data } = await api.get(`/groups/${groupId}`);
    return data;
  },
  createGroup: async (payload: any) => {
    const { data } = await api.post('/groups/', payload);
    return data;
  },
  joinGroup: async (groupId: number) => {
    const { data } = await api.post(`/groups/${groupId}/join`);
    return data;
  },
  leaveGroup: async (groupId: number) => {
    const { data } = await api.post(`/groups/${groupId}/leave`);
    return data;
  },
  getMessages: async (groupId: number) => {
    const { data } = await api.get(`/groups/${groupId}/messages`);
    return data;
  },
  sendMessage: async (groupId: number, content: string) => {
    const { data } = await api.post(`/groups/${groupId}/messages`, { content });
    return data;
  },
  getChallenges: async (groupId: number) => {
    const { data } = await api.get(`/groups/${groupId}/challenges`);
    return data;
  },
  createChallenge: async (groupId: number, payload: any) => {
    const { data } = await api.post(`/groups/${groupId}/challenges`, payload);
    return data;
  },
  getMembers: async (groupId: number) => {
    const { data } = await api.get(`/groups/${groupId}/members`);
    return data;
  },
  reactToMessage: async (groupId: number, messageId: number, emoji: string) => {
    const { data } = await api.post(`/groups/${groupId}/messages/${messageId}/react`, { emoji });
    return data;
  },
};
