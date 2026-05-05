import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/store/ThemeContext';
import { motion } from '@/utils/motion';
import { radius, spacing } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';

type Props = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
};

export function XPProgressBar({ level, xpInLevel, xpToNext }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(xpToNext, xpInLevel));
  const target = xpToNext <= 0 ? 0 : clamped / xpToNext;

  const p = useDerivedValue(() => withTiming(target, { duration: motion.duration.slow, easing: motion.easing.standard }));

  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0.06, p.value) * 100}%` } as any));

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <CText variant="micro" tone="sub">{`Level ${level}`}</CText>
        <CText variant="micro" tone="muted">{`${clamped}/${xpToNext} XP`}</CText>
      </View>
      <View style={[s.track, { backgroundColor: colors.strokeSubtle, borderColor: colors.strokeSubtle }]}>
        <Animated.View style={[s.fill, { backgroundColor: colors.primary }, fill]} />
        <View style={[s.glow, { backgroundColor: colors.primaryWash }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing[2] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: {
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
  },
});

