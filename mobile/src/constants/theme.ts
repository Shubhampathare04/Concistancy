// ─── Color Palettes ───────────────────────────────────────────────────────────

export const darkColors = {
  // Backgrounds — layered depth system
  bg:          '#080808',   // deepest layer
  background:  '#080808',   // alias for bg
  surface:     '#111111',   // base surface
  card:        '#181818',   // card layer
  cardAlt:     '#202020',   // elevated card
  cardHigh:    '#282828',   // highest card
  border:      '#242424',
  borderLight: '#2e2e2e',

  // Brand
  primary:       '#ff6b35',
  primaryDim:    '#ff6b3514',
  primaryBorder: '#ff6b3538',
  primaryGlow:   '#ff6b3560',

  // Semantic
  green:       '#34d399',
  greenDim:    '#34d39914',
  greenGlow:   '#34d39940',
  yellow:      '#fbbf24',
  yellowDim:   '#fbbf2414',
  yellowGlow:  '#fbbf2440',
  blue:        '#60a5fa',
  blueDim:     '#60a5fa14',
  purple:      '#a78bfa',
  purpleDim:   '#a78bfa14',
  red:         '#f87171',
  redDim:      '#f8717114',

  // Text hierarchy
  text:          '#f5f5f5',
  textSub:       '#a0a0a0',
  textSecondary: '#a0a0a0',  // alias for textSub
  textMuted:     '#606060',
  textDim:       '#303030',

  white:   '#ffffff',
  overlay: 'rgba(0,0,0,0.75)',
};

export const lightColors = {
  bg:          '#f2f2f7',   // iOS system background
  background:  '#f2f2f7',   // alias for bg
  surface:     '#ffffff',
  card:        '#ffffff',
  cardAlt:     '#f8f8f8',
  cardHigh:    '#f0f0f0',
  border:      '#e5e5ea',
  borderLight: '#ebebf0',

  primary:       '#e85d2a',
  primaryDim:    '#e85d2a0f',
  primaryBorder: '#e85d2a30',
  primaryGlow:   '#e85d2a50',

  green:       '#059669',
  greenDim:    '#05966910',
  greenGlow:   '#05966935',
  yellow:      '#d97706',
  yellowDim:   '#d9770610',
  yellowGlow:  '#d9770635',
  blue:        '#2563eb',
  blueDim:     '#2563eb10',
  purple:      '#7c3aed',
  purpleDim:   '#7c3aed10',
  red:         '#dc2626',
  redDim:      '#dc262610',

  text:          '#1c1c1e',   // iOS label
  textSub:       '#48484a',   // iOS secondary label
  textSecondary: '#48484a',   // alias for textSub
  textMuted:     '#8e8e93',   // iOS tertiary label
  textDim:       '#c7c7cc',   // iOS quaternary label

  white:   '#ffffff',
  overlay: 'rgba(0,0,0,0.35)',
};

export type AppColors = typeof darkColors;

// ─── 8pt Spacing Grid ─────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  full: 999,
};

// ─── Typography Scale (SF Pro style) ─────────────────────────────────────────
export const font = {
  xs:    11,   // caption2
  sm:    13,   // caption1 / footnote
  md:    15,   // body
  lg:    17,   // headline
  xl:    20,   // title3
  xxl:   28,   // title2
  xxxl:  34,   // largeTitle
  hero:  48,   // hero numbers
};

// ─── Shadows / Depth ──────────────────────────────────────────────────────────
export const shadow = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
};

// ─── Glow Shadows ─────────────────────────────────────────────────────────────
export const glow = {
  primary: {
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  green: {
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  yellow: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  purple: {
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── Gradients ────────────────────────────────────────────────────────────────
export const gradients = {
  primary:     ['#ff6b35', '#ff3d00'] as const,
  primarySoft: ['#ff7a47', '#ff5722'] as const,
  xp:          ['#fbbf24', '#f59e0b'] as const,
  streak:      ['#ff6b35', '#ef4444'] as const,
  success:     ['#34d399', '#10b981'] as const,
  purple:      ['#a78bfa', '#8b5cf6'] as const,
  blue:        ['#60a5fa', '#3b82f6'] as const,
  dark:        ['#1c1c1c', '#141414'] as const,
  card:        ['#202020', '#181818'] as const,
  overlay:     ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'] as const,
};
