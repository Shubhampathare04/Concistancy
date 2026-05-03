/**
 * TaskCard
 * ─────────────────────────────────────────────────────────────────────────────
 * CRED-style card with:
 *  • Live sensor tracking (steps / timer / reps / water)
 *  • Animated circular progress ring
 *  • Real-time counter display
 *  • Swipe-to-complete gesture
 *  • Auto-complete when target is reached
 *  • Haptic feedback throughout
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, PanResponder, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius, shadow } from '@/constants/theme';
import { Task, SensorType } from '@/features/tasks/types';
import { useTaskSensor, sensorLabel, sensorIcon, detectSensorType, detectTarget } from '@/hooks/useTaskSensor';
import ProgressRing from '@/components/ProgressRing';

interface Props {
  task: Task;
  onComplete: (id: number) => void;
  onFocus?: (task: Task) => void;
  completing?: boolean;
}

const SCREEN_W        = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_W * 0.32;

const DIFFICULTY = [
  { label: 'Very Easy', color: '#34d399', xp: 10 },
  { label: 'Easy',      color: '#86efac', xp: 20 },
  { label: 'Medium',    color: '#fbbf24', xp: 30 },
  { label: 'Hard',      color: '#f97316', xp: 40 },
  { label: 'Extreme',   color: '#f87171', xp: 50 },
];

const SCHEDULE_ICON: Record<string, string> = {
  daily:    'repeat',
  weekly:   'calendar-outline',
  one_time: 'flag-outline',
};

function formatProgress(value: number, type: SensorType): string {
  if (type === 'steps') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  }
  return String(value);
}

export default function TaskCard({ task, onComplete, onFocus, completing }: Props) {
  const { colors, isDark } = useTheme();
  const diff = DIFFICULTY[Math.min(task.difficulty - 1, 4)];

  // Resolve sensor type + target (from task fields or auto-detect from title)
  const sensorType: SensorType = task.sensor_type ?? detectSensorType(task.title, task.description);
  const target: number         = task.target ?? detectTarget(task.title, task.description) ?? 0;
  const hasSensor              = sensorType !== 'none' && target > 0;

  const [expanded, setExpanded] = useState(hasSensor);
  const [autoCompleted, setAutoCompleted] = useState(false);

  const { progress, pct, done, isTracking, increment, decrement } = useTaskSensor({
    taskId:     task.id,
    sensorType,
    target,
    active:     hasSensor && !completing && !autoCompleted,
  });

  // Auto-complete when target is hit
  useEffect(() => {
    if (done && hasSensor && !autoCompleted && !completing) {
      setAutoCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => onComplete(task.id), 600);
    }
  }, [done, hasSensor, autoCompleted, completing]);

  // Animations
  const translateX     = useRef(new Animated.Value(0)).current;
  const pressScale     = useRef(new Animated.Value(1)).current;
  const swipeTriggered = useRef(false);
  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const glowAnim       = useRef(new Animated.Value(0)).current;

  // Pulse the ring when tracking
  useEffect(() => {
    if (!isTracking) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isTracking]);

  // Glow when near completion
  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: pct > 0.8 ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,

      onPanResponderMove: (_, g) => {
        if (g.dx < 0) return;
        translateX.setValue(g.dx);
        if (g.dx > SWIPE_THRESHOLD && !swipeTriggered.current) {
          swipeTriggered.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } else if (g.dx < SWIPE_THRESHOLD) {
          swipeTriggered.current = false;
        }
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Animated.timing(translateX, { toValue: SCREEN_W, duration: 220, useNativeDriver: true })
            .start(() => { translateX.setValue(0); swipeTriggered.current = false; onComplete(task.id); });
        } else {
          Animated.spring(translateX, { toValue: 0, tension: 180, friction: 14, useNativeDriver: true })
            .start(() => { swipeTriggered.current = false; });
        }
      },
    })
  ).current;

  const handleComplete = useCallback(() => {
    if (completing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, tension: 280, friction: 8, useNativeDriver: true }),
    ]).start();
    onComplete(task.id);
  }, [completing, onComplete, task.id]);

  const swipeBgOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1], extrapolate: 'clamp',
  });
  const checkScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD], outputRange: [0.6, 1.15], extrapolate: 'clamp',
  });
  const cardOpacity = translateX.interpolate({
    inputRange: [SWIPE_THRESHOLD * 0.8, SCREEN_W], outputRange: [1, 0], extrapolate: 'clamp',
  });

  const ringColor = done ? '#34d399' : pct > 0.6 ? diff.color : colors.primary;
  const progressLabel = formatProgress(progress, sensorType);
  const targetLabel   = formatProgress(target, sensorType);
  const unit          = sensorLabel(sensorType);
  const icon          = sensorIcon(sensorType);

  return (
    <View style={s.container}>
      {/* Swipe reveal */}
      <Animated.View style={[s.swipeBg, { opacity: swipeBgOpacity }]}>
        <LinearGradient colors={['#34d39920', '#34d39940']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[s.swipeIconWrap, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark-circle" size={32} color="#34d399" />
        </Animated.View>
        <Text style={s.swipeLabel}>Complete</Text>
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[{ transform: [{ translateX }, { scale: pressScale }], opacity: cardOpacity }]}
        {...panResponder.panHandlers}
      >
        <View style={[s.card, { backgroundColor: colors.card, borderColor: done ? '#34d39940' : colors.border }, shadow.sm]}>
          {/* Done overlay shimmer */}
          {done && (
            <LinearGradient colors={['#34d39908', '#34d39918', '#34d39908']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          )}

          {/* Left accent */}
          <View style={[s.accent, { backgroundColor: done ? '#34d399' : diff.color }]} />

          <View style={s.body}>
            {/* Title row */}
            <View style={s.titleRow}>
              <Text style={[s.title, { color: colors.text }]} numberOfLines={hasSensor ? 1 : 2}>
                {task.title}
              </Text>
              {hasSensor && (
                <TouchableOpacity
                  style={[s.sensorBadge, { backgroundColor: isTracking ? ringColor + '20' : colors.surface, borderColor: isTracking ? ringColor + '50' : colors.border }]}
                  onPress={() => setExpanded((e) => !e)}
                  activeOpacity={0.7}
                >
                  <View style={[s.trackingDot, { backgroundColor: isTracking ? ringColor : colors.textDim }]} />
                  <Ionicons name={icon as any} size={11} color={isTracking ? ringColor : colors.textMuted} />
                  <Text style={[s.sensorBadgeTxt, { color: isTracking ? ringColor : colors.textMuted }]}>
                    {isTracking ? 'LIVE' : 'SENSOR'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Meta row */}
            <View style={s.metaRow}>
              <View style={[s.diffBadge, { backgroundColor: diff.color + '18' }]}>
                <View style={[s.diffDot, { backgroundColor: diff.color }]} />
                <Text style={[s.diffTxt, { color: diff.color }]}>{diff.label}</Text>
              </View>
              <View style={s.metaItem}>
                <Ionicons name={SCHEDULE_ICON[task.schedule_type] as any} size={11} color={colors.textMuted} />
                <Text style={[s.metaTxt, { color: colors.textMuted }]}>{task.schedule_type}</Text>
              </View>
              {task.estimated_minutes ? (
                <View style={s.metaItem}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={[s.metaTxt, { color: colors.textMuted }]}>{task.estimated_minutes}m</Text>
                </View>
              ) : null}
              <View style={[s.xpBadge, { backgroundColor: colors.yellow + '12' }]}>
                <Ionicons name="flash" size={9} color={colors.yellow} />
                <Text style={[s.xpTxt, { color: colors.yellow }]}>+{diff.xp} XP</Text>
              </View>
            </View>

            {/* ── Sensor Progress Panel ── */}
            {hasSensor && expanded && (
              <View style={[s.sensorPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={s.sensorLeft}>
                  {/* Progress ring */}
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <ProgressRing
                      size={72}
                      strokeWidth={5}
                      progress={pct}
                      color={ringColor}
                      trackColor={colors.border}
                    >
                      <View style={s.ringInner}>
                        <Text style={[s.ringPct, { color: ringColor }]}>
                          {Math.round(pct * 100)}
                        </Text>
                        <Text style={[s.ringPctSymbol, { color: colors.textMuted }]}>%</Text>
                      </View>
                    </ProgressRing>
                  </Animated.View>
                </View>

                <View style={s.sensorRight}>
                  {/* Live counter */}
                  <View style={s.counterRow}>
                    <Text style={[s.counterVal, { color: colors.text }]}>{progressLabel}</Text>
                    <Text style={[s.counterSep, { color: colors.textMuted }]}>/</Text>
                    <Text style={[s.counterTarget, { color: colors.textMuted }]}>{targetLabel}</Text>
                    <Text style={[s.counterUnit, { color: colors.textMuted }]}>{unit}</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={[s.miniTrack, { backgroundColor: colors.border }]}>
                    <Animated.View style={[s.miniFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: ringColor }]} />
                  </View>

                  {/* Manual controls for reps/water */}
                  {(sensorType === 'reps' || sensorType === 'water') && (
                    <View style={s.manualRow}>
                      <TouchableOpacity style={[s.manualBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={decrement}>
                        <Ionicons name="remove" size={16} color={colors.textSub} />
                      </TouchableOpacity>
                      <Text style={[s.manualHint, { color: colors.textMuted }]}>
                        {sensorType === 'reps' ? 'Tap to log rep' : 'Tap to log glass'}
                      </Text>
                      <TouchableOpacity style={[s.manualBtn, { backgroundColor: ringColor + '20', borderColor: ringColor + '40' }]} onPress={increment}>
                        <Ionicons name="add" size={16} color={ringColor} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Steps live indicator */}
                  {sensorType === 'steps' && (
                    <View style={s.liveRow}>
                      <View style={[s.liveDot, { backgroundColor: isTracking ? '#34d399' : colors.textDim }]} />
                      <Text style={[s.liveTxt, { color: isTracking ? '#34d399' : colors.textMuted }]}>
                        {isTracking ? 'Tracking motion...' : 'Move to start tracking'}
                      </Text>
                    </View>
                  )}

                  {/* Timer live indicator */}
                  {sensorType === 'timer' && (
                    <View style={s.liveRow}>
                      <View style={[s.liveDot, { backgroundColor: isTracking ? colors.blue : colors.textDim }]} />
                      <Text style={[s.liveTxt, { color: isTracking ? colors.blue : colors.textMuted }]}>
                        {isTracking ? 'Timer running...' : 'Timer paused'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Complete button */}
          <View style={s.rightActions}>
            {onFocus && (
              <TouchableOpacity
                style={[s.focusBtn, { backgroundColor: colors.blue + '18', borderColor: colors.blue + '40' }]}
                onPress={() => onFocus(task)}
                activeOpacity={0.75}
              >
                <Ionicons name="timer-outline" size={16} color={colors.blue} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                s.doneBtn,
                {
                  backgroundColor: done ? '#34d399' + '30' : completing ? colors.border : '#34d399' + '18',
                  borderColor:     done ? '#34d399' + '60' : completing ? colors.border : '#34d399' + '40',
                },
              ]}
              onPress={handleComplete}
              disabled={completing}
              activeOpacity={0.75}
            >
              {completing
                ? <ActivityIndicator size="small" color={colors.textMuted} />
                : <Ionicons name={done ? 'checkmark-circle' : 'checkmark'} size={22} color="#34d399" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 10 },

  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    gap: 10,
    overflow: 'hidden',
  },
  swipeIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  swipeLabel:    { fontWeight: '700', fontSize: font.md, color: '#34d399' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accent: { width: 4, alignSelf: 'stretch' },
  body:   { flex: 1, paddingVertical: 14, paddingHorizontal: spacing.md },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title:    { flex: 1, fontSize: font.md, fontWeight: '700', lineHeight: 22, letterSpacing: -0.2 },

  sensorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  trackingDot:    { width: 5, height: 5, borderRadius: 3 },
  sensorBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  diffBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  diffDot:  { width: 5, height: 5, borderRadius: 3 },
  diffTxt:  { fontSize: font.xs, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:  { fontSize: font.xs, textTransform: 'capitalize' },
  xpBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  xpTxt:    { fontSize: font.xs, fontWeight: '700' },

  // Sensor panel
  sensorPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  sensorLeft:  { alignItems: 'center', justifyContent: 'center' },
  sensorRight: { flex: 1, gap: 6 },

  ringInner:     { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 1 },
  ringPct:       { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  ringPctSymbol: { fontSize: 9, fontWeight: '700', marginTop: 3 },

  counterRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  counterVal:   { fontSize: font.xl, fontWeight: '900', letterSpacing: -0.5 },
  counterSep:   { fontSize: font.sm, fontWeight: '400' },
  counterTarget: { fontSize: font.md, fontWeight: '600' },
  counterUnit:  { fontSize: font.xs, fontWeight: '500', marginLeft: 2 },

  miniTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  miniFill:  { height: '100%', borderRadius: 2 },

  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  manualBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  manualHint: { flex: 1, fontSize: 10, fontWeight: '500', textAlign: 'center' },

  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveTxt: { fontSize: 10, fontWeight: '600' },

  doneBtn: {
    width: 48, height: 48,
    borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  focusBtn: {
    width: 36, height: 36,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  rightActions: {
    alignItems: 'center',
    marginRight: 12,
    marginTop: 14,
    gap: 4,
  },
});
