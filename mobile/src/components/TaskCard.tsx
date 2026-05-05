import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/store/ThemeContext';
import { gradients, radius, shadow, spacing } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { haptics } from '@/hooks/useHaptics';
import { motion } from '@/utils/motion';
import type { Task } from '@/features/tasks/types';

type Props = {
  task: Task;
  onComplete: (taskId: number) => void;
  onSkip: (taskId: number) => void;
  disabled?: boolean;
  // Legacy props (ignored in rebuilt UI)
  onFocus?: (task: Task) => void;
  completing?: boolean;
};

const ACTION_X = 86;

export const TaskCard = memo(function TaskCard({ task, onComplete, onSkip, disabled }: Props) {
  const { colors } = useTheme();
  const x = useSharedValue(0);
  const settled = useSharedValue(0);

  const difficulty = Math.max(1, Math.min(5, task.difficulty || 3));
  const meta = useMemo(() => {
    const xp = difficulty * 10;
    const label = difficulty <= 2 ? 'Quick win' : difficulty === 3 ? 'Steady' : difficulty === 4 ? 'Hard' : 'Boss';
    const tint = difficulty <= 2 ? colors.success : difficulty === 3 ? colors.warning : difficulty === 4 ? colors.primary2 : colors.error;
    return { xp, label, tint };
  }, [colors, difficulty]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      settled.value = x.value;
    })
    .onUpdate((e) => {
      const next = settled.value + e.translationX;
      x.value = Math.max(-ACTION_X, Math.min(ACTION_X, next));
    })
    .onEnd(() => {
      const done = x.value > 56;
      const skip = x.value < -56;
      if (done) {
        x.value = withTiming(ACTION_X, { duration: motion.duration.fast, easing: motion.easing.emphasized }, () => {
          x.value = withSpring(0, { damping: 16, stiffness: 180 });
        });
        runOnJS(haptics.success)();
        runOnJS(onComplete)(task.id);
        return;
      }
      if (skip) {
        x.value = withTiming(-ACTION_X, { duration: motion.duration.fast, easing: motion.easing.emphasized }, () => {
          x.value = withSpring(0, { damping: 16, stiffness: 180 });
        });
        runOnJS(haptics.medium)();
        runOnJS(onSkip)(task.id);
        return;
      }
      x.value = withSpring(0, { damping: 16, stiffness: 180 });
    });

  const cardStyle = useAnimatedStyle(() => {
    const pressDepth = interpolate(Math.abs(x.value), [0, ACTION_X], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: x.value }, { scale: 1 - pressDepth * 0.015 }],
    };
  });

  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 24, ACTION_X], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(x.value, [0, ACTION_X], [0.92, 1], Extrapolation.CLAMP) }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-ACTION_X, -24, 0], [1, 0.6, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(x.value, [-ACTION_X, 0], [1, 0.92], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={s.row}>
      <Animated.View style={[s.actionLeft, leftStyle]}>
        <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.actionPill}>
          <Ionicons name="checkmark" size={18} color={colors.white} />
          <CText variant="micro" style={{ color: colors.white }}>{`+${meta.xp} XP`}</CText>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[s.actionRight, rightStyle]}>
        <Surface layer="bg2" rounded="pill" border style={[s.actionPill, { backgroundColor: colors.bg2 }]}>
          <Ionicons name="arrow-forward" size={18} color={colors.textSub} style={{ transform: [{ rotate: '180deg' }] }} />
          <CText variant="micro" tone="sub">Later</CText>
        </Surface>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <Surface layer="bg1" rounded="lg" border style={[s.card, shadow.sm]}>
            <LinearGradient colors={[meta.tint + '18', 'transparent']} style={StyleSheet.absoluteFill} />

            <View style={s.top}>
              <View style={s.dotWrap}>
                <View style={[s.dot, { backgroundColor: meta.tint }]} />
              </View>
              <CText variant="micro" tone="sub">{meta.label}</CText>
              <View style={{ flex: 1 }} />
              <Surface layer="bg2" rounded="pill" border style={s.xpBadge}>
                <Ionicons name="flash" size={14} color={colors.warning} />
                <CText variant="micro" tone="sub">{`${meta.xp}`}</CText>
              </Surface>
            </View>

            <CText variant="title" style={s.title} numberOfLines={2}>
              {task.title}
            </CText>
            {task.description ? (
              <CText variant="caption" tone="muted" numberOfLines={2}>
                {task.description}
              </CText>
            ) : null}
          </Surface>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export default TaskCard;

const s = StyleSheet.create({
  row: { marginBottom: spacing[3], justifyContent: 'center' },
  actionLeft: { position: 'absolute', left: 0, top: 10, bottom: 10, justifyContent: 'center' },
  actionRight: { position: 'absolute', right: 0, top: 10, bottom: 10, justifyContent: 'center' },
  actionPill: {
    width: ACTION_X,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  card: { padding: spacing[5], gap: spacing[2] },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  dotWrap: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  title: { marginTop: spacing[1] },
});

