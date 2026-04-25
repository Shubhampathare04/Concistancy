export const darkColors = {
  bg: '#0a0a0a',
  surface: '#141414',
  card: '#1c1c1c',
  cardAlt: '#222222',
  border: '#2a2a2a',
  borderLight: '#333333',
  primary: '#ff6b35',
  primaryDim: '#ff6b3518',
  primaryBorder: '#ff6b3540',
  green: '#4ade80',
  greenDim: '#4ade8018',
  yellow: '#fbbf24',
  yellowDim: '#fbbf2418',
  blue: '#60a5fa',
  blueDim: '#60a5fa18',
  purple: '#a78bfa',
  purpleDim: '#a78bfa18',
  red: '#f87171',
  redDim: '#f8717118',
  white: '#ffffff',
  text: '#f0f0f0',
  textSub: '#aaaaaa',
  textMuted: '#666666',
  textDim: '#444444',
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightColors = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  cardAlt: '#f0f0f0',
  border: '#e5e5e5',
  borderLight: '#eeeeee',
  primary: '#e85d2a',
  primaryDim: '#e85d2a12',
  primaryBorder: '#e85d2a35',
  green: '#16a34a',
  greenDim: '#16a34a12',
  yellow: '#d97706',
  yellowDim: '#d9770612',
  blue: '#2563eb',
  blueDim: '#2563eb12',
  purple: '#7c3aed',
  purpleDim: '#7c3aed12',
  red: '#dc2626',
  redDim: '#dc262612',
  white: '#ffffff',
  text: '#111111',
  textSub: '#444444',
  textMuted: '#888888',
  textDim: '#bbbbbb',
  overlay: 'rgba(0,0,0,0.4)',
};

export type AppColors = typeof darkColors;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, full: 999,
};

export const font = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 32,
};

export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  primary: (color: string) => ({ shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }),
};
