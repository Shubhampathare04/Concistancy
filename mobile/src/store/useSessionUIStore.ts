import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

interface SessionUIState {
  /** Task IDs hidden for the rest of the day (coach "not today" — no delete). */
  skippedByDay: Record<string, number[]>;
  skipTaskForToday: (taskId: number) => void;
  isSkippedToday: (taskId: number) => boolean;
}

export const useSessionUIStore = create<SessionUIState>()(
  persist(
    (set, get) => ({
      skippedByDay: {},
      skipTaskForToday: (taskId: number) => {
        const d = todayKey();
        const prev = get().skippedByDay[d] ?? [];
        if (prev.includes(taskId)) return;
        set({
          skippedByDay: { ...get().skippedByDay, [d]: [...prev, taskId] },
        });
      },
      isSkippedToday: (taskId: number) => {
        const d = todayKey();
        return (get().skippedByDay[d] ?? []).includes(taskId);
      },
    }),
    {
      name: '@consistency_session_ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ skippedByDay: s.skippedByDay }),
    }
  )
);
