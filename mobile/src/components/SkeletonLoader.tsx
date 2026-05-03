import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius } from '@/constants/theme';

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 20, borderRadius = radius.sm, style }: Props) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.card],
  });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: bg }, style]}
    />
  );
}

export function TaskCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[s.bar, { backgroundColor: colors.border }]} />
      <View style={s.body}>
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="40%" height={12} />
      </View>
      <SkeletonBox width={42} height={42} borderRadius={10} style={{ marginRight: 16 }} />
    </View>
  );
}

export function HomeHeaderSkeleton() {
  return (
    <View style={{ gap: 12, paddingHorizontal: 20, paddingTop: 16 }}>
      <SkeletonBox width="50%" height={28} borderRadius={8} />
      <SkeletonBox width="100%" height={100} borderRadius={20} />
      <SkeletonBox width="100%" height={8} borderRadius={4} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonBox height={80} style={{ flex: 1 }} borderRadius={14} />
        <SkeletonBox height={80} style={{ flex: 1 }} borderRadius={14} />
        <SkeletonBox height={80} style={{ flex: 1 }} borderRadius={14} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  bar: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: 16 },
});
