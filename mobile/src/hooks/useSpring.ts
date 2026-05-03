import { useRef } from 'react';
import { Animated } from 'react-native';

export const SPRING_CONFIGS = {
  snappy: { tension: 400, friction: 15 },
  bouncy: { tension: 300, friction: 12 },
  smooth: { tension: 200, friction: 20 },
  gentle: { tension: 150, friction: 25 },
  pop:    { tension: 500, friction: 8 },
} as const;

export function useButtonSpring() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, ...SPRING_CONFIGS.snappy, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, ...SPRING_CONFIGS.bouncy, useNativeDriver: true }).start();

  return { scale, onPressIn, onPressOut };
}

export function useEntrance(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const enter = () => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, ...SPRING_CONFIGS.smooth, delay, useNativeDriver: true }),
    ]).start();
  };

  return { opacity, translateY, enter };
}

export function usePopIn() {
  const scale = useRef(new Animated.Value(0)).current;

  const pop = (onDone?: () => void) => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, ...SPRING_CONFIGS.pop, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    ...SPRING_CONFIGS.snappy, useNativeDriver: true }),
    ]).start(onDone);
  };

  return { scale, pop };
}
