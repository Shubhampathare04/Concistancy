import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius, type, gradients } from '@/constants/theme';

interface Props {
  totalXp: number;
  level: number;
  /** XP within current level (e.g. xp % 100 if backend uses 100 per level) */
  xpInLevel: number;
  xpToNext: number;
}

export default function XPBar({ totalXp, level, xpInLevel, xpToNext }: Props) {
  const { colors } = useTheme();
  const pct = xpToNext > 0 ? Math.min(xpInLevel / xpToNext, 1) : 1;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(pct, { damping: 18, stiffness: 120 });
  }, [pct, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.top}>
        <View style={s.left}>
          <LinearGradient colors={gradients.xp} style={s.iconBg}>
            <Ionicons name="flash" size={16} color="#0a0a0a" />
          </LinearGradient>
          <View>
            <Text style={[s.xpVal, { color: colors.text }]}>{totalXp.toLocaleString()} XP</Text>
            <Text style={[s.xpSub, { color: colors.textMuted }, type.micro]}>Level {level} · next unlock</Text>
          </View>
        </View>
        <View style={[s.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.badgeTxt, { color: colors.textSub }]}>
            {xpToNext - xpInLevel > 0 ? `${xpToNext - xpInLevel} to Lv ${level + 1}` : 'Level up!'}
          </Text>
        </View>
      </View>
      <View style={[s.track, { backgroundColor: colors.surface }]}>
        <Animated.View style={[s.fill, fillStyle]}>
          <LinearGradient colors={gradients.xp} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={s.shine} />
        </Animated.View>
      </View>
      <View style={s.footer}>
        <Text style={[s.pct, { color: colors.textMuted }, type.caption]}>{Math.round(pct * 100)}% toward next reward</Text>
        <View style={s.dots}>
          {[0.25, 0.5, 0.75].map((m) => (
            <View
              key={m}
              style={[s.dot, { backgroundColor: pct >= m ? colors.yellow : colors.border }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  xpSub: { marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  track: { height: 14, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, overflow: 'hidden' },
  shine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pct: { fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
