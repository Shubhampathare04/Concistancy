import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, AppColors } from '@/constants/theme';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  colors: AppColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  colors: darkColors,
  isDark: true,
  setMode: () => {},
});

const STORAGE_KEY = '@theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // re-renders when OS theme changes
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  // For system mode: read Appearance.getColorScheme() directly — more reliable than
  // useColorScheme() which can return null before the bridge is ready
  const resolveSystemDark = (): boolean => {
    // useColorScheme() is the reactive value — use it when available
    if (systemScheme !== null) return systemScheme === 'dark';
    // Fallback: read synchronously from Appearance API
    return (Appearance.getColorScheme() ?? 'dark') === 'dark';
  };

  const isDark =
    mode === 'dark'   ? true :
    mode === 'light'  ? false :
    resolveSystemDark();

  const colors: AppColors = isDark ? darkColors : lightColors;

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
