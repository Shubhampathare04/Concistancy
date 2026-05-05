import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/store/ThemeContext';
import { radius, spacing } from '@/constants/theme';

function Shimmer({ width, height, rounded = radius.md }: { width: number; height: number; rounded?: number }) {
  const { colors } = useTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0.28, 0.55, 0.28], Extrapolation.CLAMP),
  }));
  return (
    <Animated.View style={style}>
      <View style={{ width, height, borderRadius: rounded, backgroundColor: colors.strokeSubtle }} />
    </Animated.View>
  );
}

export function TodaySkeleton() {
  return (
    <View style={s.wrap}>
      <Shimmer width={220} height={22} />
      <Shimmer width={320} height={150} rounded={radius.xl} />
      <Shimmer width={120} height={14} />
      <Shimmer width={320} height={96} rounded={radius.lg} />
      <Shimmer width={320} height={96} rounded={radius.lg} />
      <Shimmer width={320} height={96} rounded={radius.lg} />
    </View>
  );
}

// Legacy exports for older screens still in repo.
export function HomeHeaderSkeleton() {
  return (
    <View style={s.wrap}>
      <Shimmer width={200} height={28} />
      <Shimmer width={320} height={130} rounded={radius.xl} />
    </View>
  );
}

export function TaskCardSkeleton() {
  return <Shimmer width={320} height={96} rounded={radius.lg} />;
}

const s = StyleSheet.create({
  wrap: { gap: spacing[3], paddingTop: spacing[6], paddingHorizontal: spacing[5] },
});

