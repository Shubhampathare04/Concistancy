import { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius, gradients } from '@/constants/theme';

interface Props {
  visible: boolean;
  xpGained: number;
  newStreak: number;
  levelUp: boolean;
  newLevel: number;
  coinsGained?: number;
  onClose: () => void;
}

const { height: SCREEN_H } = Dimensions.get('window');

export default function RewardModal({ visible, xpGained, newStreak, levelUp, newLevel, coinsGained = 0, onClose }: Props) {
  const { colors } = useTheme();

  const bgOpacity  = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const xpPop      = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 75, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start(() => {
        Animated.parallel([
          Animated.spring(iconBounce, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
          Animated.spring(xpPop,     { toValue: 1, tension: 110, friction: 7, useNativeDriver: true }),
        ]).start();
      });
    } else {
      bgOpacity.setValue(0); slideAnim.setValue(SCREEN_H);
      fadeAnim.setValue(0);  xpPop.setValue(0); iconBounce.setValue(0.5);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_H * 0.4, duration: 220, useNativeDriver: true }),
    ]).start(onClose);
  };

  const accentColor = levelUp ? colors.purple : colors.green;
  const iconName    = levelUp ? 'trophy' : 'checkmark-circle';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[s.backdrop, { opacity: bgOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
        {/* Top accent line */}
        <LinearGradient colors={levelUp ? gradients.purple : gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.topLine} />

        <View style={[s.handle, { backgroundColor: colors.border }]} />

        {/* Icon */}
        <Animated.View style={[s.iconCircle, { backgroundColor: accentColor + '15', borderColor: accentColor + '30' }, { transform: [{ scale: iconBounce }] }]}>
          <Ionicons name={iconName as any} size={48} color={accentColor} />
        </Animated.View>

        <Text style={[s.title, { color: colors.text }]}>
          {levelUp ? 'Level Up!' : 'Task Complete!'}
        </Text>
        <Text style={[s.subtitle, { color: colors.textMuted }]}>
          {levelUp ? `You've reached Level ${newLevel}` : 'One step closer to your goal'}
        </Text>

        {/* XP Badge */}
        <Animated.View style={[s.xpBadge, { transform: [{ scale: xpPop }] }]}>
          <LinearGradient colors={gradients.xp} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.xpGradient}>
            <Ionicons name="flash" size={22} color="#000" />
            <Text style={s.xpNum}>+{xpGained}</Text>
            <Text style={s.xpLabel}>XP</Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: colors.surface, borderColor: colors.primary + '25' }]}>
            <Ionicons name="flame" size={22} color={colors.primary} />
            <Text style={[s.statVal, { color: colors.primary }]}>{newStreak}</Text>
            <Text style={[s.statLbl, { color: colors.textMuted }]}>Day Streak</Text>
          </View>
          {levelUp && (
            <View style={[s.statBox, { backgroundColor: colors.surface, borderColor: colors.purple + '25' }]}>
              <Ionicons name="star" size={22} color={colors.purple} />
              <Text style={[s.statVal, { color: colors.purple }]}>{newLevel}</Text>
              <Text style={[s.statLbl, { color: colors.textMuted }]}>New Level</Text>
            </View>
          )}
          {coinsGained > 0 && (
            <View style={[s.statBox, { backgroundColor: colors.surface, borderColor: colors.yellow + '25' }]}>
              <Ionicons name="diamond" size={22} color={colors.yellow} />
              <Text style={[s.statVal, { color: colors.yellow }]}>+{coinsGained}</Text>
              <Text style={[s.statLbl, { color: colors.textMuted }]}>Coins</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.cta} onPress={handleClose} activeOpacity={0.9}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaInner}>
            <Text style={s.ctaTxt}>Keep Going</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: spacing.xl, paddingBottom: 52,
    alignItems: 'center', overflow: 'hidden',
  },
  topLine:    { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  handle:     { width: 40, height: 4, borderRadius: 2, marginTop: 14, marginBottom: 28 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, borderWidth: 1,
  },
  title:      { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle:   { fontSize: font.md, marginBottom: spacing.xl, textAlign: 'center' },
  xpBadge:    { marginBottom: spacing.xl },
  xpGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 28, paddingVertical: 16, borderRadius: radius.full,
  },
  xpNum:   { fontSize: font.xxxl, fontWeight: '900', color: '#000', letterSpacing: -1 },
  xpLabel: { fontSize: font.xl, fontWeight: '800', color: '#000' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, width: '100%' },
  statBox: {
    flex: 1, borderRadius: radius.xl, borderWidth: 1,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5 },
  statLbl: { fontSize: font.xs, fontWeight: '600' },
  cta:     { width: '100%', borderRadius: radius.lg, overflow: 'hidden' },
  ctaInner: {
    paddingVertical: 18, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  ctaTxt: { color: '#fff', fontWeight: '800', fontSize: font.lg, letterSpacing: 0.2 },
});
