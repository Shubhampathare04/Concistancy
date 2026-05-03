import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setAuth: (data: { user: User; token: string; refresh_token: string }) => void;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@auth_state';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isHydrated: false,

  setAuth: (data) => {
    const state = { user: data.user, token: data.token, refreshToken: data.refresh_token };
    // Synchronous — triggers navigation immediately
    set(state);
    // Persist in background — never block navigation on AsyncStorage
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.error);
  },

  setToken: (token, refreshToken) => {
    set((s) => ({ token, refreshToken: refreshToken ?? s.refreshToken }));
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...parsed, token, ...(refreshToken ? { refreshToken } : {}) })
        ).catch(console.error);
      }
    }).catch(console.error);
  },

  logout: () => {
    // Synchronous — clears state immediately
    set({ user: null, token: null, refreshToken: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ ...parsed, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));
