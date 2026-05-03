import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function usePulse(minVal = 0.85, maxVal = 1.0, duration = 1200) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: minVal, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: maxVal, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return anim;
}
