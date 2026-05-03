import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { useCreateTask } from '../hooks/useTasks';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { font, spacing, radius, gradients } from '@/constants/theme';
import { detectSensorType, detectTarget, sensorLabel, sensorIcon } from '@/hooks/useTaskSensor';
import { SensorType } from '../types';

const DIFFICULTIES = [
  { value: 1, label: 'Very Easy', color: '#4ade80', icon: 'happy-outline'   },
  { value: 2, label: 'Easy',      color: '#86efac', icon: 'happy-outline'   },
  { value: 3, label: 'Medium',    color: '#fbbf24', icon: 'fitness-outline' },
  { value: 4, label: 'Hard',      color: '#f97316', icon: 'barbell-outline' },
  { value: 5, label: 'Extreme',   color: '#f87171', icon: 'flame-outline'   },
] as const;

const SCHEDULES = [
  { value: 'daily',    label: 'Daily',    icon: 'repeat-outline'   },
  { value: 'weekly',   label: 'Weekly',   icon: 'calendar-outline' },
  { value: 'one_time', label: 'One Time', icon: 'flag-outline'     },
] as const;

const SENSOR_META: Record<SensorType, { label: string; desc: string; color: string; grad: readonly [string, string] }> = {
  steps: { label: 'Step Counter',   desc: 'Tracks steps via motion sensor in real-time', color: '#34d399', grad: ['#34d39920', '#34d39908'] },
  timer: { label: 'Timer',          desc: 'Counts elapsed minutes automatically',         color: '#60a5fa', grad: ['#60a5fa20', '#60a5fa08'] },
  reps:  { label: 'Rep Counter',    desc: 'Tap to log each rep manually',                 color: '#f97316', grad: ['#f9731620', '#f9731608'] },
  water: { label: 'Hydration Log',  desc: 'Tap to log each glass of water',               color: '#38bdf8', grad: ['#38bdf820', '#38bdf808'] },
  none:  { label: 'Manual',         desc: 'Mark complete when done',                      color: '#a78bfa', grad: ['#a78bfa20', '#a78bfa08'] },
};

// Quick-fill templates
const TEMPLATES = [
  { title: '10,000 steps daily',    icon: 'walk-outline',    color: '#34d399' },
  { title: '30 min meditation',     icon: 'timer-outline',   color: '#60a5fa' },
  { title: '100 pushups',           icon: 'barbell-outline', color: '#f97316' },
  { title: '8 glasses of water',    icon: 'water-outline',   color: '#38bdf8' },
  { title: '45 min study session',  icon: 'book-outline',    color: '#a78bfa' },
  { title: '5km run',               icon: 'walk-outline',    color: '#fbbf24' },
];

export default function CreateTaskScreen() {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [schedule, setSchedule]     = useState('daily');
  const [minutes, setMinutes]       = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [error, setError]           = useState('');
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { mutate: createTask, isPending } = useCreateTask();

  // Live sensor detection as user types
  const detectedSensor = useMemo(() => detectSensorType(title, description), [title, description]);
  const detectedTarget = useMemo(() => {
    if (targetInput) return parseInt(targetInput) || 0;
    return detectTarget(title, description) ?? 0;
  }, [title, description, targetInput]);

  const sensorMeta = SENSOR_META[detectedSensor];
  const hasSensor  = detectedSensor !== 'none';

  const handleCreate = () => {
    if (!title.trim()) { setError('Please enter a task title'); return; }
    setError('');
    createTask(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        schedule_type: schedule as any,
        estimated_minutes: minutes ? parseInt(minutes) : undefined,
        target:      detectedTarget > 0 ? detectedTarget : undefined,
        sensor_type: detectedSensor !== 'none' ? detectedSensor : undefined,
      },
      {
        onSuccess: () => {
          setTitle(''); setDescription(''); setMinutes(''); setTargetInput('');
          setDifficulty(3); setSchedule('daily');
          navigation.navigate('Home');
        },
        onError: (e: any) => {
          setError(e?.response?.data?.detail ?? 'Failed to create task. Check your connection.');
        },
      }
    );
  };

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header title="New Task" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Quick Templates ── */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.templateScroll} contentContainerStyle={s.templateRow}>
            {TEMPLATES.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[s.templateChip, { backgroundColor: t.color + '15', borderColor: t.color + '35' }]}
                onPress={() => setTitle(t.title)}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon as any} size={13} color={t.color} />
                <Text style={[s.templateTxt, { color: t.color }]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Title ── */}
          <Input
            label="Task Title"
            placeholder="e.g. 10,000 steps daily"
            value={title}
            onChangeText={setTitle}
            autoFocus
            leftIcon={<Ionicons name="create-outline" size={18} color={colors.textMuted} />}
          />

          {/* ── Live Sensor Detection Card ── */}
          {title.length > 2 && (
            <View style={[s.sensorDetectCard, { borderColor: sensorMeta.color + '40' }]}>
              <LinearGradient colors={sensorMeta.grad as any} style={StyleSheet.absoluteFill} />
              <View style={[s.sensorDetectIcon, { backgroundColor: sensorMeta.color + '20' }]}>
                <Ionicons name={sensorIcon(detectedSensor) as any} size={20} color={sensorMeta.color} />
              </View>
              <View style={s.sensorDetectBody}>
                <View style={s.sensorDetectTop}>
                  <Text style={[s.sensorDetectLabel, { color: sensorMeta.color }]}>
                    {hasSensor ? 'Smart Tracking Detected' : 'Manual Task'}
                  </Text>
                  <View style={[s.sensorTypePill, { backgroundColor: sensorMeta.color + '20', borderColor: sensorMeta.color + '40' }]}>
                    <Text style={[s.sensorTypeTxt, { color: sensorMeta.color }]}>{sensorMeta.label}</Text>
                  </View>
                </View>
                <Text style={[s.sensorDetectDesc, { color: colors.textSub }]}>{sensorMeta.desc}</Text>
                {detectedTarget > 0 && (
                  <View style={s.targetDetectedRow}>
                    <Ionicons name="flag-outline" size={11} color={sensorMeta.color} />
                    <Text style={[s.targetDetectedTxt, { color: sensorMeta.color }]}>
                      Target detected: {detectedTarget.toLocaleString()} {sensorLabel(detectedSensor)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Target (shown when sensor detected) ── */}
          {hasSensor && (
            <Input
              label={`Target ${sensorLabel(detectedSensor)} (auto-detected or override)`}
              placeholder={detectedTarget > 0 ? String(detectedTarget) : 'e.g. 10000'}
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="numeric"
              leftIcon={<Ionicons name="flag-outline" size={18} color={sensorMeta.color} />}
            />
          )}

          <Input
            label="Description (optional)"
            placeholder="What does this involve?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />
          <Input
            label="Estimated Minutes (optional)"
            placeholder="e.g. 30"
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
            leftIcon={<Ionicons name="time-outline" size={18} color={colors.textMuted} />}
          />

          {/* ── Difficulty ── */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Difficulty</Text>
          <View style={s.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  s.diffBtn,
                  { backgroundColor: colors.card, borderColor: difficulty === d.value ? d.color : colors.border },
                  difficulty === d.value && { backgroundColor: d.color + '18' },
                ]}
                onPress={() => setDifficulty(d.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={d.icon as any} size={20} color={difficulty === d.value ? d.color : colors.textMuted} />
                <Text style={[s.diffLabel, { color: difficulty === d.value ? d.color : colors.textMuted }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Schedule ── */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Schedule</Text>
          <View style={s.schedRow}>
            {SCHEDULES.map((sc) => (
              <TouchableOpacity
                key={sc.value}
                style={[
                  s.schedBtn,
                  { backgroundColor: colors.card, borderColor: schedule === sc.value ? colors.primary : colors.border },
                  schedule === sc.value && { backgroundColor: colors.primaryDim },
                ]}
                onPress={() => setSchedule(sc.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={sc.icon as any} size={22} color={schedule === sc.value ? colors.primary : colors.textMuted} />
                <Text style={[s.schedLabel, { color: schedule === sc.value ? colors.primary : colors.textMuted }]}>{sc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── XP Preview ── */}
          <View style={[s.xpPreview, { backgroundColor: colors.yellowDim, borderColor: colors.yellow + '40' }]}>
            <View style={s.xpLeft}>
              <View style={[s.xpIconWrap, { backgroundColor: colors.yellow + '20' }]}>
                <Ionicons name="flash" size={16} color={colors.yellow} />
              </View>
              <Text style={[s.xpLabel, { color: colors.textSub }]}>Completing this task earns</Text>
            </View>
            <LinearGradient colors={gradients.xp} style={s.xpValBadge}>
              <Text style={s.xpVal}>{difficulty * 10}+ XP</Text>
            </LinearGradient>
          </View>

          {/* Error */}
          {error ? (
            <View style={[s.errorBox, { backgroundColor: colors.redDim, borderColor: colors.red + '40' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
              <Text style={[s.errorTxt, { color: colors.red }]}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Create Task"
            onPress={handleCreate}
            loading={isPending}
            style={s.createBtn}
            icon={<Ionicons name="add-circle-outline" size={18} color="#fff" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll:    { paddingHorizontal: spacing.md, paddingBottom: 100 },

  sectionLabel: { fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm, color: '#888' },

  templateScroll: { marginBottom: spacing.md, marginHorizontal: -18 },
  templateRow:    { paddingHorizontal: 18, gap: 8, flexDirection: 'row' },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1,
  },
  templateTxt: { fontSize: font.xs, fontWeight: '700' },

  // Sensor detection card
  sensorDetectCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: radius.xl, borderWidth: 1,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  sensorDetectIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sensorDetectBody: { flex: 1, gap: 4 },
  sensorDetectTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sensorDetectLabel: { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.4 },
  sensorTypePill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  sensorTypeTxt:    { fontSize: 10, fontWeight: '700' },
  sensorDetectDesc: { fontSize: font.xs, lineHeight: 16 },
  targetDetectedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  targetDetectedTxt: { fontSize: 10, fontWeight: '700' },

  diffRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn:   { flex: 1, minWidth: '28%', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: 4 },
  diffLabel: { fontSize: font.xs, fontWeight: '600', textAlign: 'center' },

  schedRow:   { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  schedBtn:   { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 6 },
  schedLabel: { fontSize: font.xs, fontWeight: '600' },

  xpPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1 },
  xpLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  xpLabel:   { fontSize: font.sm },
  xpValBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  xpVal:     { fontSize: font.md, fontWeight: '900', color: '#000' },

  createBtn: { marginTop: spacing.sm },
  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  errorTxt:  { fontSize: font.sm, flex: 1 },
});
