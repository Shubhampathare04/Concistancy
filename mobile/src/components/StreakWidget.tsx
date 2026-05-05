import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius, type } from '@/constants/theme';
import ProgressRing from '@/components/ProgressRing';

interface Props {
  streak: number;
  subtitle: string;
  /** 0–1 today completion */
  dayProgress: number;
  level: number;
}

export default function StreakWidget({ streak, subtitle, dayProgress, level }: Props) {
  const { colors, isDark } = useTheme();
  const flame = useSharedValue(1);
  const glow = useSharedValue(0.35);

  useEffect(() => {
    flame.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: streak >= 7 ? 700 : 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: streak >= 7 ? 700 : 1100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [streak, flame, glow]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flame.value }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={[s.wrap, { borderColor: colors.primaryBorder }]}>
      <LinearGradient
        colors={isDark ? ['#1a0f08', '#120806', '#1a0f08'] : ['#fff5f0', '#ffe8dc', '#fff8f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          s.orb,
          { backgroundColor: colors.primary },
          orbStyle,
        ]}
      />
      <View style={s.row}>
        <View style={s.ringCol}>
          <Animated.View style={[s.flameTop, flameStyle]}>
            <Ionicons name="flame" size={26} color={colors.primary} />
          </Animated.View>
          <ProgressRing
            size={108}
            strokeWidth={7}
            progress={Math.min(Math.max(dayProgress, 0), 1)}
            color={colors.primary}
            trackColor={isDark ? colors.border : colors.borderLight}
          >
            <View style={s.ringInner}>
              <Text style={[s.streakNum, { color: colors.text }]}>{streak}</Text>
              <Text style={[s.streakLbl, { color: colors.textMuted }, type.heroLabel]}>STREAK</Text>
            </View>
          </ProgressRing>
        </View>

        <View style={s.copy}>
          <View style={[s.lv, { backgroundColor: colors.secondaryDim, borderColor: colors.secondaryBorder }]}>
            <LinearGradient colors={['#9333ea55', '#c084fc33']} style={StyleSheet.absoluteFill} />
            <Ionicons name="sparkles" size={12} color={colors.secondary} />
            <Text style={[s.lvTxt, { color: colors.secondary }]}>LV {level}</Text>
          </View>
          <Text style={[s.coach, { color: colors.text }]}>{subtitle}</Text>
          <Text style={[s.hint, { color: colors.textMuted }]}>
            {dayProgress >= 1 ? 'Day crushed. Come back tomorrow.' : 'Close the ring by finishing today’s missions.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  orb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ringCol: { alignItems: 'center' },
  flameTop: { marginBottom: -6, zIndex: 2 },
  ringInner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  streakNum: { fontSize: 40, fontWeight: '900', letterSpacing: -2, lineHeight: 42 },
  streakLbl: { marginTop: 0 },
  copy: { flex: 1, gap: spacing.sm },
  lv: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lvTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  coach: { ...type.subtitle, lineHeight: 22 },
  hint: { ...type.caption, opacity: 0.95 },
});
