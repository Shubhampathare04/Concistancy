import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    instant: 90,
    fast: 160,
    base: 220,
    slow: 320,
    ritual: 520,
  },
  easing: {
    standard: Easing.bezier(0.2, 0.0, 0.2, 1),
    emphasized: Easing.bezier(0.2, 0.0, 0.0, 1),
    springy: Easing.bezier(0.16, 1, 0.3, 1),
  },
} as const;

