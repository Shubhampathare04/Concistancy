import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import { authApi } from '@/features/tasks/api';
import { useAuthStore } from '@/store/useAuthStore';
import { font, spacing, radius, gradients } from '@/constants/theme';
import { TASK_TEMPLATES } from './templateData';

const { width: W } = Dimensions.get('window');

const GOALS = [
  { key: 'fitness',      label: 'Get Fit',        icon: 'barbell-outline',    color: '#f97316' },
  { key: 'learning',     label: 'Learn More',      icon: 'book-outline',       color: '#60a5fa' },
  { key: 'mindfulness',  label: 'Be Mindful',      icon: 'leaf-outline',       color: '#34d399' },
  { key: 'productivity', label: 'Be Productive',   icon: 'rocket-outline',     color: '#a78bfa' },
  { key: 'diet',         label: 'Eat Better',      icon: 'nutrition-outline',  color: '#fbbf24' },
  { key: 'other',        label: 'My Own Goal',     icon: 'star-outline',       color: '#f87171' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const [step, setStep]           = useState(0);
  const [goal, setGoal]           = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [selected, setSelected]   = useState<string[]>([]);
  const [reminderHour, setReminderHour] = useState(9);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const templates = goal && TASK_TEMPLATES[goal] ? TASK_TEMPLATES[goal] : TASK_TEMPLATES['fitness'];

  const { mutate: onboard, isPending } = useMutation({
    mutationFn: () => authApi.onboard({
      goal: goal === 'other' ? customGoal : goal,
      starter_task_titles: selected,
      reminder_hour: reminderHour,
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Mark onboarded in store — triggers navigation
      if (user && token && refreshToken) {
        setAuth({ user: { ...user, is_onboarded: true } as any, token, refresh_token: refreshToken });
      }
    },
  });

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(slideAnim, { toValue: -(step + 1) * W, duration: 300, useNativeDriver: true }).start();
    setStep(s => s + 1);
  };

  const goPrev = () => {
    Animated.timing(slideAnim, { toValue: -( step - 1) * W, duration: 300, useNativeDriver: true }).start();
    setStep(s => s - 1);
  };

  const toggleTask = (title: string) => {
    setSelected(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : prev.length < 3 ? [...prev, title] : prev
    );
  };

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const fmtHour = (h: number) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`;

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Progress dots */}
      <View style={s.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[s.dot, { backgroundColor: i <= step ? colors.primary : colors.border }]} />
        ))}
      </View>

      <Animated.View style={[s.slides, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── Step 0: Pick Goal ── */}
        <View style={[s.slide, { width: W }]}>
          <Text style={[s.heading, { color: colors.text }]}>What's your main goal?</Text>
          <Text style={[s.sub, { color: colors.textMuted }]}>We'll personalise your experience around it.</Text>
          <View style={s.goalGrid}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.key}
                style={[s.goalCard, {
                  backgroundColor: goal === g.key ? g.color + '20' : colors.card,
                  borderColor: goal === g.key ? g.color : colors.border,
                }]}
                onPress={() => setGoal(g.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={g.icon as any} size={28} color={goal === g.key ? g.color : colors.textMuted} />
                <Text style={[s.goalLabel, { color: goal === g.key ? g.color : colors.textSub }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {goal === 'other' && (
            <TextInput
              style={[s.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Describe your goal..."
              placeholderTextColor={colors.textMuted}
              value={customGoal}
              onChangeText={setCustomGoal}
            />
          )}
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: colors.primary, opacity: !goal ? 0.4 : 1 }]}
            onPress={goNext}
            disabled={!goal}
          >
            <Text style={s.nextTxt}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Step 1: Pick Starter Tasks ── */}
        <View style={[s.slide, { width: W }]}>
          <TouchableOpacity style={s.backBtn} onPress={goPrev}>
            <Ionicons name="arrow-back" size={20} color={colors.textSub} />
          </TouchableOpacity>
          <Text style={[s.heading, { color: colors.text }]}>Pick 3 starter tasks</Text>
          <Text style={[s.sub, { color: colors.textMuted }]}>These will be added to your daily list. ({selected.length}/3)</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {templates.map((t: any) => {
              const isSelected = selected.includes(t.title);
              return (
                <TouchableOpacity
                  key={t.title}
                  style={[s.taskRow, {
                    backgroundColor: isSelected ? colors.primary + '14' : colors.card,
                    borderColor: isSelected ? colors.primaryBorder : colors.border,
                  }]}
                  onPress={() => toggleTask(t.title)}
                  activeOpacity={0.8}
                >
                  <View style={[s.taskCheck, {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={s.taskInfo}>
                    <Text style={[s.taskTitle, { color: colors.text }]}>{t.title}</Text>
                    <Text style={[s.taskMeta, { color: colors.textMuted }]}>
                      Difficulty {t.difficulty} {t.minutes ? `• ${t.minutes} min` : ''}
                    </Text>
                  </View>
                  {t.sensor && t.sensor !== 'none' && (
                    <View style={[s.sensorPill, { backgroundColor: colors.surface }]}>
                      <Ionicons
                        name={t.sensor === 'steps' ? 'walk-outline' : t.sensor === 'timer' ? 'timer-outline' : t.sensor === 'reps' ? 'barbell-outline' : 'water-outline'}
                        size={12} color={colors.textMuted}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: colors.primary, opacity: selected.length === 0 ? 0.4 : 1 }]}
            onPress={goNext}
            disabled={selected.length === 0}
          >
            <Text style={s.nextTxt}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Step 2: Set Reminder ── */}
        <View style={[s.slide, { width: W }]}>
          <TouchableOpacity style={s.backBtn} onPress={goPrev}>
            <Ionicons name="arrow-back" size={20} color={colors.textSub} />
          </TouchableOpacity>
          <Text style={[s.heading, { color: colors.text }]}>When should we remind you?</Text>
          <Text style={[s.sub, { color: colors.textMuted }]}>We'll send a daily nudge at this time.</Text>

          <View style={[s.clockCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={[colors.primary + '10', colors.primary + '04']} style={StyleSheet.absoluteFill} />
            <Ionicons name="alarm-outline" size={32} color={colors.primary} />
            <Text style={[s.clockTime, { color: colors.primary }]}>{fmtHour(reminderHour)}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hourScroll} contentContainerStyle={s.hourRow}>
            {HOURS.map(h => (
              <TouchableOpacity
                key={h}
                style={[s.hourChip, {
                  backgroundColor: reminderHour === h ? colors.primary : colors.surface,
                  borderColor: reminderHour === h ? colors.primary : colors.border,
                }]}
                onPress={() => setReminderHour(h)}
              >
                <Text style={[s.hourTxt, { color: reminderHour === h ? '#fff' : colors.textMuted }]}>
                  {fmtHour(h)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
            onPress={() => onboard()}
            disabled={isPending}
          >
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextGrad}>
              <Text style={s.nextTxt}>{isPending ? 'Setting up...' : "Let's Go!"}</Text>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onboard()} style={s.skipBtn}>
            <Text style={[s.skipTxt, { color: colors.textMuted }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, paddingTop: 60 },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  slides: { flexDirection: 'row', flex: 1 },
  slide:  { paddingHorizontal: spacing.lg, flex: 1 },

  heading: { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5, marginBottom: spacing.sm },
  sub:     { fontSize: font.md, marginBottom: spacing.xl, lineHeight: 22 },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.lg },
  goalCard: { width: (W - 48 - 12) / 2, borderRadius: radius.xl, borderWidth: 1.5, padding: spacing.md, alignItems: 'center', gap: 8 },
  goalLabel: { fontSize: font.sm, fontWeight: '700', textAlign: 'center' },

  customInput: { borderWidth: 1, borderRadius: radius.lg, padding: 14, fontSize: font.md, marginBottom: spacing.md },

  backBtn: { marginBottom: spacing.md },

  taskRow:   { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, marginBottom: 8, gap: 12 },
  taskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  taskInfo:  { flex: 1 },
  taskTitle: { fontSize: font.sm, fontWeight: '700' },
  taskMeta:  { fontSize: font.xs, marginTop: 2 },
  sensorPill: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  clockCard: { borderRadius: radius.xxl, padding: spacing.xl, alignItems: 'center', gap: 8, marginBottom: spacing.lg, borderWidth: 1, overflow: 'hidden' },
  clockTime: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },

  hourScroll: { marginBottom: spacing.xl, maxHeight: 50 },
  hourRow:    { gap: 8, paddingHorizontal: 4 },
  hourChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  hourTxt:    { fontSize: font.xs, fontWeight: '700' },

  nextBtn:  { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.md },
  nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  nextTxt:  { color: '#fff', fontWeight: '800', fontSize: font.lg },

  skipBtn: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  skipTxt: { fontSize: font.sm },
});
