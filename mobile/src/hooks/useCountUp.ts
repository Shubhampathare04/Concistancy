import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useCountUp(target: number, duration = 800, enabled = true) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    anim.setValue(0);
    const listener = anim.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false, // must be false for JS-driven value reading
    }).start(() => {
      setDisplay(target);
      anim.removeListener(listener);
    });
    return () => anim.removeListener(listener);
  }, [target, enabled]);

  return display;
}
