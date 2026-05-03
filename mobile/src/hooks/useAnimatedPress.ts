import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface Options {
  scale?: number;      // how far to compress (default 0.95)
  tension?: number;    // spring tension (default 300)
  friction?: number;   // spring friction (default 10)
}

export function useAnimatedPress(options: Options = {}) {
  const { scale = 0.95, tension = 300, friction = 10 } = options;
  const anim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(anim, {
      toValue: scale,
      tension,
      friction,
      useNativeDriver: true,
    }).start();
  }, [anim, scale, tension, friction]);

  const onPressOut = useCallback(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: tension * 0.8,
      friction: friction * 1.2,
      useNativeDriver: true,
    }).start();
  }, [anim, tension, friction]);

  const style = { transform: [{ scale: anim }] };

  return { onPressIn, onPressOut, style, anim };
}
