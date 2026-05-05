import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { useCreateTask } from '@/features/tasks/hooks/useTasks';
import { useAISuggest } from '@/hooks/useAISuggest';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { AnimatedPressable } from '@/components/primitives/AnimatedPressable';
import { radius, shadow, spacing } from '@/constants/theme';
import { haptics } from '@/hooks/useHaptics';
import { BottomSheet } from '@/components/BottomSheet';

const DIFF = [
  { v: 1, label: 'Tiny', hint: '2–5 min', icon: 'leaf', tint: '#2EE59D' },
  { v: 2, label: 'Light', hint: '5–10 min', icon: 'sparkles', tint: '#52B6FF' },
  { v: 3, label: 'Steady', hint: '15–25 min', icon: 'barbell', tint: '#FFC14D' },
  { v: 4, label: 'Hard', hint: '30–45 min', icon: 'flame', tint: '#FF5C9A' },
  { v: 5, label: 'Boss', hint: '60+ min', icon: 'rocket', tint: '#FF4D6D' },
] as const;

const CATS = [
  { id: 'focus', label: 'Focus', icon: 'eye' },
  { id: 'move', label: 'Move', icon: 'walk' },
  { id: 'mind', label: 'Mind', icon: 'leaf' },
  { id: 'fuel', label: 'Fuel', icon: 'restaurant' },
  { id: 'sleep', label: 'Rest', icon: 'moon' },
] as const;

export function CreateScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { mutate: createTask, isPending } = useCreateTask();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [minutes, setMinutes] = useState<number>(25);
  const [category, setCategory] = useState<(typeof CATS)[number]['id']>('focus');
  const [error, setError] = useState<string>('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'one_time'>('daily');

  const inputRef = useRef<TextInput>(null);
  const { data: ai, isFetching } = useAISuggest(title, notes);
  const suggestions = useMemo(() => (ai?.suggestions?.length ? ai.suggestions.slice(0, 6) : []), [ai]);

  const commit = () => {
    if (!title.trim()) {
      setError('Name the mission.');
      haptics.warning();
      inputRef.current?.focus();
      return;
    }
    setError('');
    createTask(
      {
        title: title.trim(),
        description: notes.trim() ? notes.trim() : undefined,
        difficulty,
        schedule_type: schedule,
        estimated_minutes: minutes,
      },
      {
        onSuccess: () => {
          haptics.success();
          nav.navigate('Today');
        },
        onError: () => {
          haptics.error();
          setError('Could not create. Check connection.');
        },
      }
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Surface layer="bg1" rounded="xl" border style={s.hero}>
            <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
            <CText variant="sectionLabel" tone="primary">New mission</CText>
            <CText variant="heroTitle" style={{ marginTop: spacing[1] }}>Make it inevitable.</CText>
            <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
              Minimal input. Maximum follow-through.
            </CText>
          </Surface>

          <Surface layer="bg1" rounded="xl" border style={s.block}>
            <CText variant="sectionLabel" tone="muted">Title</CText>
            <View style={[s.inputWrap, { borderColor: colors.strokeSubtle }]}>
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
              <TextInput
                ref={inputRef}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. 25m deep work, phone away"
                placeholderTextColor={colors.textMuted}
                style={[s.input, { color: colors.text }]}
                autoFocus
                returnKeyType="done"
              />
            </View>

            {suggestions.length ? (
              <View style={{ marginTop: spacing[3], gap: spacing[2] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="sparkles" size={16} color={colors.primary2} />
                  <CText variant="micro" tone="sub">AI suggestions</CText>
                  {isFetching ? <CText variant="micro" tone="muted">…</CText> : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {suggestions.map((sugg: string, idx: number) => (
                    <AnimatedPressable
                      key={idx}
                      onPress={() => {
                        haptics.select();
                        setTitle(sugg);
                      }}
                      style={[s.sugg, { borderColor: colors.strokeSubtle, backgroundColor: colors.bg2 }]}
                    >
                      <CText variant="caption" tone="sub" numberOfLines={2} style={{ maxWidth: 220 }}>
                        {sugg}
                      </CText>
                    </AnimatedPressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </Surface>

          <Surface layer="bg1" rounded="xl" border style={s.block}>
            <CText variant="sectionLabel" tone="muted">Category</CText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: spacing[2] }}>
              {CATS.map((c) => {
                const on = c.id === category;
                return (
                  <AnimatedPressable
                    key={c.id}
                    onPress={() => {
                      haptics.select();
                      setCategory(c.id);
                    }}
                    style={[
                      s.chip,
                      { borderColor: on ? colors.primary : colors.strokeSubtle, backgroundColor: on ? colors.primaryWash : colors.bg2 },
                    ]}
                  >
                    <Ionicons name={`${c.icon}-outline` as any} size={16} color={on ? colors.primary : colors.textMuted} />
                    <CText variant="micro" tone={on ? 'primary' : 'sub'}>{c.label}</CText>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </Surface>

          <Surface layer="bg1" rounded="xl" border style={s.block}>
            <CText variant="sectionLabel" tone="muted">Difficulty</CText>
            <View style={s.diffGrid}>
              {DIFF.map((d) => {
                const on = d.v === difficulty;
                return (
                  <AnimatedPressable
                    key={d.v}
                    onPress={() => {
                      haptics.light();
                      setDifficulty(d.v);
                      setMinutes(d.v <= 2 ? 10 : d.v === 3 ? 25 : d.v === 4 ? 45 : 60);
                    }}
                    style={[
                      s.diff,
                      {
                        borderColor: on ? colors.primary : colors.strokeSubtle,
                        backgroundColor: on ? colors.primaryWash : colors.bg2,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={d.icon as any} size={16} color={on ? colors.primary : colors.textMuted} />
                      <CText variant="micro" tone={on ? 'primary' : 'sub'}>{d.label}</CText>
                    </View>
                    <CText variant="micro" tone="muted">{d.hint}</CText>
                  </AnimatedPressable>
                );
              })}
            </View>
            <AnimatedPressable
              onPress={() => {
                haptics.select();
                setSheetOpen(true);
              }}
              style={[s.advancedBtn, { borderColor: colors.strokeSubtle, backgroundColor: colors.bg2 }]}
            >
              <Ionicons name="options-outline" size={16} color={colors.textSub} />
              <CText variant="micro" tone="sub">{`Advanced setup · ${minutes}m · ${schedule}`}</CText>
            </AnimatedPressable>
          </Surface>

          <Surface layer="bg1" rounded="xl" border style={s.block}>
            <CText variant="sectionLabel" tone="muted">Notes (optional)</CText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Why it matters, what ‘done’ means…"
              placeholderTextColor={colors.textMuted}
              style={[s.notes, { color: colors.text, borderColor: colors.strokeSubtle }]}
              multiline
            />
          </Surface>

          {error ? (
            <Surface layer="bg1" rounded="lg" border style={[s.error, { borderColor: colors.error + '55' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <CText variant="caption" tone="error" style={{ flex: 1 }}>{error}</CText>
            </Surface>
          ) : null}

          <AnimatedPressable
            onPress={commit}
            disabled={isPending}
            style={[
              s.primary,
              shadow.md,
              { opacity: isPending ? 0.8 : 1 },
            ]}
          >
            <LinearGradient colors={[colors.primary, colors.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBg} />
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <CText variant="body" style={{ color: colors.white }}>
              {isPending ? 'Locking in…' : 'Commit mission'}
            </CText>
          </AnimatedPressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={{ gap: spacing[4] }}>
          <View>
            <CText variant="sectionLabel" tone="muted">Time box</CText>
            <View style={s.sheetRow}>
              {[10, 15, 25, 45, 60].map((m) => {
                const on = m === minutes;
                return (
                  <AnimatedPressable
                    key={m}
                    onPress={() => {
                      haptics.select();
                      setMinutes(m);
                    }}
                    style={[
                      s.sheetChip,
                      { borderColor: on ? colors.primary : colors.strokeSubtle, backgroundColor: on ? colors.primaryWash : colors.bg2 },
                    ]}
                  >
                    <CText variant="micro" tone={on ? 'primary' : 'sub'}>{`${m}m`}</CText>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
          <View>
            <CText variant="sectionLabel" tone="muted">Cadence</CText>
            <View style={s.sheetRow}>
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'one_time', label: 'Once' },
              ].map((c) => {
                const on = c.id === schedule;
                return (
                  <AnimatedPressable
                    key={c.id}
                    onPress={() => {
                      haptics.select();
                      setSchedule(c.id as any);
                    }}
                    style={[
                      s.sheetChip,
                      { borderColor: on ? colors.primary : colors.strokeSubtle, backgroundColor: on ? colors.primaryWash : colors.bg2 },
                    ]}
                  >
                    <CText variant="micro" tone={on ? 'primary' : 'sub'}>{c.label}</CText>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
          <AnimatedPressable
            onPress={() => setSheetOpen(false)}
            style={[s.done, { backgroundColor: colors.primary }]}
          >
            <CText variant="body" style={{ color: colors.white }}>Done</CText>
          </AnimatedPressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[20], gap: spacing[4] },
  hero: { padding: spacing[5], overflow: 'hidden' },
  block: { padding: spacing[5], gap: spacing[2] },
  inputWrap: {
    marginTop: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: { flex: 1, fontSize: 16, fontWeight: '700' },
  sugg: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing[2] },
  diff: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  advancedBtn: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notes: {
    marginTop: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 92,
    fontSize: 15,
    fontWeight: '600',
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing[4] },
  primary: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  primaryBg: { ...StyleSheet.absoluteFillObject },
  sheetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing[2] },
  sheetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  done: {
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

