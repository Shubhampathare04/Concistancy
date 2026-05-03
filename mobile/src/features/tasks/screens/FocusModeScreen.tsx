import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/store/ThemeContext';
import { tasksApi } from '@/features/tasks/api';
import ProgressRing from '@/components/ProgressRing';
import { font, spacing, radius, gradients } from '@/constants/theme';

export default function FocusModeScreen() {
  const { colors, isDark } = useTheme();
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const qc    = useQueryClient();

  const task = route.params?.task;
  const [running, setRunning]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);   // seconds
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  const { mutate: focusStart } = useMutation({ mutationFn: () => tasksApi.focusStart(task?.id) });
  const { mutate: focusEnd, isPending: ending } = useMutation({
    mutationFn: () => tasksApi.focusEnd(task?.id),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setFinished(true);
    },
  });

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (running) {
      focusStart();
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1200, useNativeDriver: true }),
      ]));
      pulse.start();
      return () => { pulse.stop(); if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [running]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const estimated = task?.estimated_minutes ?? 30;
  const progress  = Math.min(elapsed / (estimated * 60), 1);
  const bonusXp   = Math.min(Math.floor(elapsed / 600) * 5, 50);

  const handleEnd = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setRunning(false);
    focusEnd();
  };

  if (finished) {
    return (
      <View style={[s.root, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#34d39920', '#34d39908']} style={StyleSheet.absoluteFill} />
        <Ionicons name="checkmark-circle" size={80} color="#34d399" />
        <Text style={[s.doneTitle, { color: colors.text }]}>Focus Complete!</Text>
        <Text style={[s.doneSub, { color: colors.textMuted }]}>{fmtTime(elapsed)} of deep work</Text>
        {bonusXp > 0 && (
          <LinearGradient colors={gradients.xp} style={s.xpBadge}>
            <Ionicons name="flash" size={18} color="#000" />
            <Text style={s.xpBadgeTxt}>+{bonusXp} Bonus XP</Text>
          </LinearGradient>
        )}
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: colors.primary }]} onPress={() => nav.goBack()}>
          <Text style={s.doneBtnTxt}>Back to Tasks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[s.root, { backgroundColor: colors.bg, opacity: fadeAnim }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={running ? [colors.primary + '12', colors.bg] : [colors.bg, colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Close */}
      <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.surface }]} onPress={() => nav.goBack()}>
        <Ionicons name="close" size={20} color={colors.textSub} />
      </TouchableOpacity>

      {/* Task name */}
      <Text style={[s.taskName, { color: colors.text }]} numberOfLines={2}>
        {task?.title ?? 'Focus Session'}
      </Text>
      <Text style={[s.taskMeta, { color: colors.textMuted }]}>
        {estimated} min estimated • Difficulty {task?.difficulty ?? 1}
      </Text>

      {/* Ring */}
      <Animated.View style={[s.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
        <ProgressRing size={220} strokeWidth={10} progress={progress} color={colors.primary} trackColor={colors.border}>
          <View style={s.ringInner}>
            <Text style={[s.timerTxt, { color: colors.text }]}>{fmtTime(elapsed)}</Text>
            <Text style={[s.timerSub, { color: colors.textMuted }]}>
              {running ? 'In focus' : elapsed > 0 ? 'Paused' : 'Ready'}
            </Text>
          </View>
        </ProgressRing>
      </Animated.View>

      {/* Bonus XP preview */}
      {elapsed > 0 && (
        <View style={[s.bonusPill, { backgroundColor: colors.yellow + '14', borderColor: colors.yellow + '30' }]}>
          <Ionicons name="flash" size={13} color={colors.yellow} />
          <Text style={[s.bonusTxt, { color: colors.yellow }]}>+{bonusXp} bonus XP earned</Text>
        </View>
      )}

      {/* Controls */}
      <View style={s.controls}>
        <TouchableOpacity
          style={[s.mainBtn, { backgroundColor: running ? colors.surface : colors.primary, borderColor: running ? colors.border : colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setRunning(r => !r);
          }}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={32} color={running ? colors.text : '#fff'} />
        </TouchableOpacity>

        {elapsed > 0 && (
          <TouchableOpacity
            style={[s.endBtn, { backgroundColor: colors.green + '18', borderColor: colors.green + '40' }]}
            onPress={handleEnd}
            disabled={ending}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.green} />
            <Text style={[s.endTxt, { color: colors.green }]}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[s.hint, { color: colors.textDim }]}>
        Earn 5 bonus XP for every 10 minutes of focus (max +50 XP)
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  closeBtn: { position: 'absolute', top: 56, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  taskName: { fontSize: font.xxl, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  taskMeta: { fontSize: font.sm, marginBottom: spacing.xl },
  ringWrap: { marginBottom: spacing.xl },
  ringInner: { alignItems: 'center' },
  timerTxt: { fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  timerSub: { fontSize: font.sm, fontWeight: '600', marginTop: 4 },
  bonusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, marginBottom: spacing.lg },
  bonusTxt:  { fontSize: font.sm, fontWeight: '700' },
  controls:  { alignItems: 'center', gap: spacing.md },
  mainBtn:   { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  endBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.full, borderWidth: 1 },
  endTxt:    { fontSize: font.md, fontWeight: '800' },
  hint:      { position: 'absolute', bottom: 40, fontSize: font.xs, textAlign: 'center' },
  doneTitle: { fontSize: font.xxl, fontWeight: '900', marginTop: spacing.lg },
  doneSub:   { fontSize: font.md, marginTop: 6, marginBottom: spacing.xl },
  xpBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.full, marginBottom: spacing.xl },
  xpBadgeTxt: { fontSize: font.lg, fontWeight: '900', color: '#000' },
  doneBtn:   { paddingHorizontal: 32, paddingVertical: 16, borderRadius: radius.full },
  doneBtnTxt: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
