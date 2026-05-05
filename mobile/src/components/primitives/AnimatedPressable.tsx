import { PropsWithChildren, useCallback } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '@/utils/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
  scaleTo?: number;
};

export function AnimatedPressable({
  children,
  scaleTo = 0.98,
  onPressIn,
  onPressOut,
  ...props
}: PropsWithChildren<AnimatedPressableProps>) {
  const p = useSharedValue(0);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - p.value * (1 - scaleTo) }],
  }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      p.value = withTiming(1, { duration: motion.duration.fast, easing: motion.easing.springy });
      onPressIn?.(e);
    },
    [onPressIn]
  );
  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      p.value = withTiming(0, { duration: motion.duration.base, easing: motion.easing.standard });
      onPressOut?.(e);
    },
    [onPressOut]
  );

  return (
    <AnimatedPressableBase {...props} onPressIn={handleIn} onPressOut={handleOut} style={[props.style, aStyle]}>
      {children}
    </AnimatedPressableBase>
  );
}

