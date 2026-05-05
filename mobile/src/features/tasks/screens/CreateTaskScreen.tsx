import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { useCreateTask } from '../hooks/useTasks';
import { useAISuggest } from '@/hooks/useAISuggest';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { font, spacing, radius, gradients, type, shadow } from '@/constants/theme';
import { detectSensorType, detectTarget, sensorLabel, sensorIcon } from '@/hooks/useTaskSensor';
import { SensorType } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DIFFICULTIES = [
  { value: 1, label: 'Tiny', color: '#4ade80', icon: 'leaf-outline' },
  { value: 2, label: 'Light', color: '#86efac', icon: 'happy-outline' },
  { value: 3, label: 'Steady', color: '#fbbf24', icon: 'fitness-outline' },
  { value: 4, label: 'Heavy', color: '#f97316', icon: 'barbell-outline' },
  { value: 5, label: 'Beast', color: '#f87171', icon: 'flame-outline' },
] as const;

const SCHEDULES = [
  { value: 'daily', label: 'Daily', icon: 'repeat-outline' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { value: 'one_time', label: 'Once', icon: 'flag-outline' },
] as const;

const CATEGORIES = [
  { id: 'move', label: 'Move', icon: 'walk-outline', color: '#34d399' },
  { id: 'focus', label: 'Focus', icon: 'eye-outline', color: '#60a5fa' },
  { id: 'mind', label: 'Mind', icon: 'leaf-outline', color: '#a78bfa' },
  { id: 'fuel', label: 'Fuel', icon: 'restaurant-outline', color: '#f97316' },
  { id: 'sleep', label: 'Rest', icon: 'moon-outline', color: '#818cf8' },
] as const;

const TIME_MARKS = [5, 15, 25, 45, 60];

const SENSOR_META: Record<
  SensorType,
  { label: string; desc: string; color: string; grad: readonly [string, string] }
> = {
  steps: { label: 'Steps', desc: 'Motion-powered step tracking', color: '#34d399', grad: ['#34d39920', '#34d39908'] },
  timer: { label: 'Timer', desc: 'Elapsed focus time', color: '#60a5fa', grad: ['#60a5fa20', '#60a5fa08'] },
  reps: { label: 'Reps', desc: 'Tap to log each rep', color: '#f97316', grad: ['#f9731620', '#f9731608'] },
  water: { label: 'Hydration', desc: 'Log every glass', color: '#38bdf8', grad: ['#38bdf820', '#38bdf808'] },
  none: { label: 'Manual', desc: 'Check off when you finish', color: '#a78bfa', grad: ['#a78bfa20', '#a78bfa08'] },
};

const TEMPLATES = [
  { title: '10,000 steps daily', icon: 'walk-outline', color: '#34d399', cat: 'move' as const },
  { title: '30 min meditation', icon: 'timer-outline', color: '#60a5fa', cat: 'mind' as const },
  { title: 'Deep work — 45m', icon: 'eye-outline', color: '#a78bfa', cat: 'focus' as const },
  { title: '8 glasses of water', icon: 'water-outline', color: '#38bdf8', cat: 'fuel' as const },
  { title: 'Stretch + mobility', icon: 'body-outline', color: '#f97316', cat: 'move' as const },
  { title: 'Wind-down routine', icon: 'moon-outline', color: '#818cf8', cat: 'sleep' as const },
];

export default function CreateTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [schedule, setSchedule] = useState('daily');
  const [minutes, setMinutes] = useState(25);
  const [targetInput, setTargetInput] = useState('');
  const [error, setError] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id'] | null>('focus');
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: ai, isFetching: aiLoading } = useAISuggest(title, description);

  const detectedSensor = useMemo(() => detectSensorType(title, description), [title, description]);
  const detectedTarget = useMemo(() => {
    if (targetInput) return parseInt(targetInput, 10) || 0;
    return detectTarget(title, description) ?? 0;
  }, [title, description, targetInput]);

  const sensorMeta = SENSOR_META[detectedSensor];
  const hasSensor = detectedSensor !== 'none';

  const appliedAi = useRef<string | null>(null);
  useEffect(() => {
    if (!ai?.predicted_difficulty || !title.trim()) return;
    const sig = `${title.trim()}|${ai.predicted_difficulty}|${(ai.suggestions ?? []).join(',')}`;
    if (appliedAi.current === sig) return;
    appliedAi.current = sig;
    if (ai.predicted_difficulty >= 1 && ai.predicted_difficulty <= 5) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setDifficulty(ai.predicted_difficulty);
    }
  }, [ai, title]);

  const filteredTemplates = useMemo(() => {
    if (!category) return TEMPLATES;
    return TEMPLATES.filter((t) => t.cat === category);
  }, [category]);

  const suggestions = ai?.suggestions?.length ? ai.suggestions : [];

  const handleCreate = () => {
    if (!title.trim()) {
      setError('Give your mission a name');
      return;
    }
    setError('');
    const catLine = category ? `[${CATEGORIES.find((c) => c.id === category)?.label ?? 'Goal'}] ` : '';
    createTask(
      {
        title: title.trim(),
        description: [catLine.trim(), description.trim()].filter(Boolean).join('\n') || undefined,
        difficulty,
        schedule_type: schedule as 'daily' | 'weekly' | 'one_time',
        estimated_minutes: minutes,
        target: detectedTarget > 0 ? detectedTarget : undefined,
        sensor_type: detectedSensor !== 'none' ? detectedSensor : undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setTargetInput('');
          setDifficulty(3);
          setSchedule('daily');
          setMinutes(25);
          navigation.navigate('Home');
        },
        onError: (e: any) => {
          setError(e?.response?.data?.detail ?? 'Could not create — check connection.');
        },
      }
    );
  };

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header title="New mission" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <LinearGradient
            colors={isDark ? ['#1a1008', 'transparent'] : ['#fff5f0', 'transparent']}
            style={s.hero}
          >
            <Text style={[s.heroTitle, { color: colors.text }, type.title]}>Design your next win</Text>
            <Text style={[s.heroSub, { color: colors.textMuted }, type.caption]}>
              Missions adapt to how you phrase them — sensors, XP, and streaks sync automatically.
            </Text>
          </LinearGradient>

          <Text style={[s.label, { color: colors.textMuted }, type.section]}>Focus lane</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {CATEGORIES.map((c) => {
              const on = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: on ? c.color + '22' : colors.card,
                      borderColor: on ? c.color + '80' : colors.border,
                    },
                    shadow.xs,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setCategory(c.id);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={c.icon as any} size={18} color={c.color} />
                  <Text style={[s.catTxt, { color: on ? c.color : colors.textMuted }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[s.label, { color: colors.textMuted }, type.section]}>Quick sparks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.templateRow}>
            {filteredTemplates.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[s.templateCard, { backgroundColor: colors.card, borderColor: t.color + '40' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTitle(t.title);
                }}
                activeOpacity={0.88}
              >
                <LinearGradient colors={[t.color + '25', t.color + '08']} style={StyleSheet.absoluteFill} />
                <View style={[s.templateIcon, { backgroundColor: t.color + '22' }]}>
                  <Ionicons name={t.icon as any} size={20} color={t.color} />
                </View>
                <Text style={[s.templateTitle, { color: colors.text }]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Input
            label="Mission title"
            placeholder="e.g. 45m deep work, no notifications"
            value={title}
            onChangeText={setTitle}
            autoFocus
            leftIcon={<Ionicons name="create-outline" size={18} color={colors.textMuted} />}
          />

          {suggestions.length > 0 && (
            <View style={s.suggestBox}>
              <View style={s.suggestHead}>
                <Ionicons name="sparkles" size={16} color={colors.secondary} />
                <Text style={[s.suggestLabel, { color: colors.secondary }]}>AI phrasing</Text>
                {aiLoading ? <Text style={[s.suggestLoading, { color: colors.textDim }]}>…</Text> : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestChips}>
                {suggestions.map((line: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={[s.suggestChip, { borderColor: colors.secondaryBorder, backgroundColor: colors.secondaryDim }]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setTitle(line);
                    }}
                  >
                    <Text style={[s.suggestChipTxt, { color: colors.text }]} numberOfLines={2}>
                      {line}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {title.length > 2 && (
            <View style={[s.detectCard, { borderColor: sensorMeta.color + '45' }]}>
              <LinearGradient colors={sensorMeta.grad as [string, string]} style={StyleSheet.absoluteFill} />
              <View style={[s.detectIcon, { backgroundColor: sensorMeta.color + '25' }]}>
                <Ionicons name={sensorIcon(detectedSensor) as any} size={22} color={sensorMeta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.detectKicker, { color: sensorMeta.color }]}>Live detection</Text>
                <Text style={[s.detectTitle, { color: colors.text }]}>{sensorMeta.label}</Text>
                <Text style={[s.detectDesc, { color: colors.textSub }]}>{sensorMeta.desc}</Text>
                {detectedTarget > 0 && (
                  <View style={s.targetRow}>
                    <Ionicons name="flag-outline" size={12} color={sensorMeta.color} />
                    <Text style={[s.targetTxt, { color: sensorMeta.color }]}>
                      Target {detectedTarget.toLocaleString()} {sensorLabel(detectedSensor)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {hasSensor && (
            <Input
              label="Target override"
              placeholder={detectedTarget > 0 ? String(detectedTarget) : 'Optional'}
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="numeric"
              leftIcon={<Ionicons name="flag-outline" size={18} color={sensorMeta.color} />}
            />
          )}

          <Input
            label="Notes"
            placeholder="Why does this matter?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 88, textAlignVertical: 'top' }}
          />

          <Text style={[s.label, { color: colors.textMuted }, type.section]}>Effort → XP curve</Text>
          <View style={s.diffGrid}>
            {DIFFICULTIES.map((d) => {
              const on = difficulty === d.value;
              return (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    s.diffCell,
                    {
                      backgroundColor: on ? d.color + '20' : colors.card,
                      borderColor: on ? d.color : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setDifficulty(d.value);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={d.icon as any} size={22} color={on ? d.color : colors.textMuted} />
                  <Text style={[s.diffName, { color: on ? d.color : colors.textMuted }]}>{d.label}</Text>
                  <Text style={[s.diffXp, { color: colors.yellow }]}>+{d.value * 10} XP</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.label, { color: colors.textMuted }, type.section]}>Time box (minutes)</Text>
          <View style={[s.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.timeTop}>
              <Text style={[s.timeVal, { color: colors.text }]}>{minutes} min</Text>
              <Text style={[s.timeHint, { color: colors.textMuted }]}>Slide to match your session</Text>
            </View>
            <View style={s.timeMarks}>
              {TIME_MARKS.map((m) => {
                const on = minutes === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      s.timeMark,
                      on && { backgroundColor: colors.primary, borderColor: colors.primary },
                      !on && { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setMinutes(m);
                    }}
                  >
                    <Text style={[s.timeMarkTxt, { color: on ? '#fff' : colors.textMuted }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[s.timeTrack, { backgroundColor: colors.surface }]}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.timeFill, { width: `${((minutes - 5) / 55) * 100}%` }]}
              />
            </View>
          </View>

          <Text style={[s.label, { color: colors.textMuted }, type.section]}>Rhythm</Text>
          <View style={s.schedRow}>
            {SCHEDULES.map((sc) => {
              const on = schedule === sc.value;
              return (
                <TouchableOpacity
                  key={sc.value}
                  style={[
                    s.schedCell,
                    { backgroundColor: colors.card, borderColor: on ? colors.primary : colors.border },
                    on && { backgroundColor: colors.primaryDim },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSchedule(sc.value);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name={sc.icon as any} size={22} color={on ? colors.primary : colors.textMuted} />
                  <Text style={[s.schedLbl, { color: on ? colors.primary : colors.textMuted }]}>{sc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <LinearGradient colors={[colors.yellow + '18', colors.yellow + '06']} style={s.xpPreview}>
            <View style={s.xpLeft}>
              <View style={[s.xpIconWrap, { backgroundColor: colors.yellow + '22' }]}>
                <Ionicons name="flash" size={18} color={colors.yellow} />
              </View>
              <Text style={[s.xpPreviewLbl, { color: colors.textSub }]}>Reward preview</Text>
            </View>
            <LinearGradient colors={gradients.xp} style={s.xpBadge}>
              <Text style={s.xpBadgeTxt}>{difficulty * 10}+ XP</Text>
            </LinearGradient>
          </LinearGradient>

          {error ? (
            <View style={[s.errorBox, { backgroundColor: colors.errorDim, borderColor: colors.error + '40' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={[s.errorTxt, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={isPending ? 'Locking in…' : 'Commit mission'}
            onPress={handleCreate}
            loading={isPending}
            style={s.primaryBtn}
            icon={<Ionicons name="rocket-outline" size={18} color="#fff" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 120 },
  hero: { padding: spacing.md, borderRadius: radius.xl, marginBottom: spacing.md },
  heroTitle: { marginBottom: 6 },
  heroSub: { maxWidth: 320, lineHeight: 20 },
  label: { marginBottom: spacing.sm, marginTop: spacing.md },
  chipRow: { gap: 10, paddingBottom: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  catTxt: { fontSize: font.sm, fontWeight: '700' },
  templateRow: { gap: 12, paddingBottom: spacing.md },
  templateCard: {
    width: 160,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 10,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateTitle: { fontSize: font.sm, fontWeight: '700', lineHeight: 18 },
  suggestBox: { marginBottom: spacing.md },
  suggestHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  suggestLabel: { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.6 },
  suggestLoading: { fontSize: font.sm },
  suggestChips: { gap: 8 },
  suggestChip: {
    maxWidth: 220,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  suggestChipTxt: { fontSize: font.sm, fontWeight: '600', lineHeight: 18 },
  detectCard: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  detectIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detectKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  detectTitle: { fontSize: font.lg, fontWeight: '800', marginTop: 2 },
  detectDesc: { fontSize: font.xs, marginTop: 4, lineHeight: 16 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  targetTxt: { fontSize: font.xs, fontWeight: '700' },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  diffCell: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  diffName: { fontSize: font.xs, fontWeight: '700' },
  diffXp: { fontSize: 10, fontWeight: '800' },
  timeCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  timeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  timeVal: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  timeHint: { fontSize: font.xs, fontWeight: '600' },
  timeMarks: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  timeMark: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeMarkTxt: { fontSize: font.xs, fontWeight: '800' },
  timeTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timeFill: { height: '100%', borderRadius: 4 },
  schedRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  schedCell: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 6 },
  schedLbl: { fontSize: font.xs, fontWeight: '700' },
  xpPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  xpLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  xpPreviewLbl: { fontSize: font.sm, fontWeight: '600' },
  xpBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
  xpBadgeTxt: { fontSize: font.md, fontWeight: '900', color: '#0a0a0a' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  errorTxt: { fontSize: font.sm, flex: 1, fontWeight: '600' },
  primaryBtn: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
