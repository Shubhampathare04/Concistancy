// Consistency — premium design system tokens (hard reset).
// 4/8 grid, strong hierarchy, deep layers, and semantic color clarity.

export const spacing = {
  // Numeric scale (preferred)
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  // Legacy named scale (kept for build compatibility; avoid in new UI)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 40,
  pill: 999,
  // Legacy
  full: 999,
} as const;

export const typeScale = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  // Legacy aliases
  xxl: 24,
  xxxl: 30,
  hero: 48,
  '2xl': 24,
  '3xl': 30,
  '4xl': 38,
} as const;

export const typography = {
  heroNumber: { fontSize: 42, lineHeight: 44, fontWeight: '900' as const, letterSpacing: -1.6 },
  heroLabel: { fontSize: 12, lineHeight: 14, fontWeight: '900' as const, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  heroTitle: { fontSize: 22, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  section: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  title: { fontSize: 18, lineHeight: 22, fontWeight: '800' as const, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  bodyRegular: { fontSize: 15, lineHeight: 22, fontWeight: '500' as const },
  micro: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
} as const;

export const shadow = {
  xs: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.20, shadowRadius: 28, elevation: 12 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.28, shadowRadius: 46, elevation: 18 },
} as const;

export type AppColors = {
  bg0: string;
  bg1: string;
  bg2: string;
  stroke: string;
  strokeSubtle: string;
  text: string;
  textSub: string;
  textMuted: string;
  primary: string;
  primary2: string;
  primaryWash: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  white: string;
  overlay: string;
  // Legacy aliases (kept for build compatibility; avoid in new UI)
  bg: string;
  background: string;
  surface: string;
  card: string;
  cardAlt: string;
  cardHigh: string;
  border: string;
  borderLight: string;
  textSecondary: string;
  textDim: string;
  secondary: string;
  secondaryDim: string;
  secondaryBorder: string;
  primaryDim: string;
  primaryBorder: string;
  green: string;
  yellow: string;
  blue: string;
  purple: string;
  red: string;
  greenDim: string;
  yellowDim: string;
  blueDim: string;
  purpleDim: string;
  redDim: string;
  errorDim: string;
  infoDim: string;
};

export const darkColors: AppColors = {
  bg0: '#07070A',
  bg1: '#0E0F14',
  bg2: '#151722',
  stroke: '#242636',
  strokeSubtle: 'rgba(255,255,255,0.06)',
  text: '#F4F6FF',
  textSub: 'rgba(244,246,255,0.74)',
  textMuted: 'rgba(244,246,255,0.48)',
  primary: '#7C5CFF', // motivational, modern, “electric”
  primary2: '#FF5C9A', // secondary accent for delight/XP bursts
  primaryWash: 'rgba(124,92,255,0.14)',
  success: '#2EE59D',
  warning: '#FFC14D',
  error: '#FF4D6D',
  info: '#52B6FF',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.64)',
  bg: '#07070A',
  background: '#07070A',
  surface: '#0E0F14',
  card: '#0E0F14',
  cardAlt: '#151722',
  cardHigh: '#1C1F2E',
  border: '#242636',
  borderLight: 'rgba(255,255,255,0.10)',
  textSecondary: 'rgba(244,246,255,0.74)',
  textDim: 'rgba(244,246,255,0.30)',
  secondary: '#FF5C9A',
  secondaryDim: 'rgba(255,92,154,0.12)',
  secondaryBorder: 'rgba(255,92,154,0.30)',
  primaryDim: 'rgba(124,92,255,0.14)',
  primaryBorder: 'rgba(124,92,255,0.30)',
  green: '#2EE59D',
  yellow: '#FFC14D',
  blue: '#52B6FF',
  purple: '#7C5CFF',
  red: '#FF4D6D',
  greenDim: 'rgba(46,229,157,0.12)',
  yellowDim: 'rgba(255,193,77,0.12)',
  blueDim: 'rgba(82,182,255,0.12)',
  purpleDim: 'rgba(124,92,255,0.12)',
  redDim: 'rgba(255,77,109,0.12)',
  errorDim: 'rgba(255,77,109,0.12)',
  infoDim: 'rgba(82,182,255,0.12)',
};

export const lightColors: AppColors = {
  bg0: '#F6F7FB',
  bg1: '#FFFFFF',
  bg2: '#F0F2FA',
  stroke: '#E4E6F2',
  strokeSubtle: 'rgba(20,24,40,0.06)',
  text: '#121527',
  textSub: 'rgba(18,21,39,0.70)',
  textMuted: 'rgba(18,21,39,0.46)',
  primary: '#5B4BFF',
  primary2: '#FF3D88',
  primaryWash: 'rgba(91,75,255,0.10)',
  success: '#0BBF7B',
  warning: '#D38A00',
  error: '#E21D48',
  info: '#147DFF',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.28)',
  bg: '#F6F7FB',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F0F2FA',
  cardHigh: '#E9ECF8',
  border: '#E4E6F2',
  borderLight: 'rgba(20,24,40,0.10)',
  textSecondary: 'rgba(18,21,39,0.70)',
  textDim: 'rgba(18,21,39,0.30)',
  secondary: '#FF3D88',
  secondaryDim: 'rgba(255,61,136,0.10)',
  secondaryBorder: 'rgba(255,61,136,0.24)',
  primaryDim: 'rgba(91,75,255,0.10)',
  primaryBorder: 'rgba(91,75,255,0.22)',
  green: '#0BBF7B',
  yellow: '#D38A00',
  blue: '#147DFF',
  purple: '#5B4BFF',
  red: '#E21D48',
  greenDim: 'rgba(11,191,123,0.10)',
  yellowDim: 'rgba(211,138,0,0.10)',
  blueDim: 'rgba(20,125,255,0.10)',
  purpleDim: 'rgba(91,75,255,0.10)',
  redDim: 'rgba(226,29,72,0.10)',
  errorDim: 'rgba(226,29,72,0.10)',
  infoDim: 'rgba(20,125,255,0.10)',
};

export const gradients = {
  brand: [darkColors.primary, darkColors.primary2] as const,
  xp: ['#FFC14D', '#FF7A1A'] as const,
  streak: ['#FF5C9A', '#FF4D6D'] as const,
  success: ['#2EE59D', '#0BBF7B'] as const,
  ink: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)'] as const,
  // Legacy names (kept for build compatibility; avoid in new UI)
  primary: [darkColors.primary, darkColors.primary2] as const,
  primarySoft: [darkColors.primary, '#9B86FF'] as const,
  secondary: [darkColors.primary2, darkColors.primary] as const,
  purple: [darkColors.primary, '#9B86FF'] as const,
  blue: ['#52B6FF', '#147DFF'] as const,
  dark: [darkColors.bg1, darkColors.bg0] as const,
  card: [darkColors.bg2, darkColors.bg1] as const,
  overlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.80)'] as const,
} as const;

// Legacy exports (kept for build compatibility; avoid in new UI)
export const font = typeScale;
export const type = typography;
export const glow = {
  primary: {},
  green: {},
  yellow: {},
  purple: {},
} as const;
