import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { radius, spacing } from '@/constants/theme';

type Props = {
  xp: number;
  token: number;
  onDone?: () => void;
};

export function XPBurst({ xp, token, onDone }: Props) {
  const { colors } = useTheme();
  const a = useSharedValue(0);

  useEffect(() => {
    a.value = 0;
    a.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 220 }, (finished) => {
        if (finished && onDone) onDone();
      })
    );
  }, [a, onDone, token]);

  const style = useAnimatedStyle(() => ({
    opacity: a.value,
    transform: [
      { translateY: interpolate(a.value, [0, 1], [-8, -42], Extrapolation.CLAMP) },
      { scale: interpolate(a.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[s.wrap, style]}>
      <View style={[s.pill, { backgroundColor: colors.bg1, borderColor: colors.warning + '55' }]}>
        <Ionicons name="flash" size={16} color={colors.warning} />
        <CText variant="micro" tone="warning">{`+${xp} XP`}</CText>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: spacing[14], alignSelf: 'center', zIndex: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});

