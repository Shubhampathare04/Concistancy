import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { useCreateTask } from '../hooks/useTasks';
import ScreenWrapper from '@/components/ScreenWrapper';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { font, spacing, radius } from '@/constants/theme';

const DIFFICULTIES = [
  { value: 1, label: 'Very Easy', color: '#4ade80', icon: 'happy-outline' },
  { value: 2, label: 'Easy', color: '#86efac', icon: 'smile-outline' },
  { value: 3, label: 'Medium', color: '#fbbf24', icon: 'fitness-outline' },
  { value: 4, label: 'Hard', color: '#f97316', icon: 'barbell-outline' },
  { value: 5, label: 'Extreme', color: '#f87171', icon: 'skull-outline' },
] as const;

const SCHEDULES = [
  { value: 'daily', label: 'Daily', icon: 'repeat-outline' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { value: 'one_time', label: 'One Time', icon: 'flag-outline' },
] as const;

export default function CreateTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [schedule, setSchedule] = useState('daily');
  const [minutes, setMinutes] = useState('');
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { mutate: createTask, isPending } = useCreateTask();

  const handleCreate = () => {
    if (!title.trim()) { Alert.alert('Missing title', 'Please enter a task title'); return; }
    createTask(
      { title: title.trim(), description: description.trim() || undefined, difficulty, schedule_type: schedule as any, estimated_minutes: minutes ? parseInt(minutes) : undefined },
      { onSuccess: () => navigation.goBack() }
    );
  };

  const selectedDiff = DIFFICULTIES.find((d) => d.value === difficulty)!;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.title, { color: colors.text }]}>New Task</Text>
            <View style={{ width: 40 }} />
          </View>

          <Input label="Task Title" placeholder="e.g. Morning workout" value={title} onChangeText={setTitle} autoFocus
            leftIcon={<Ionicons name="create-outline" size={18} color={colors.textMuted} />} />
          <Input label="Description (optional)" placeholder="What does this involve?" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
          <Input label="Estimated Minutes (optional)" placeholder="e.g. 30" value={minutes} onChangeText={setMinutes} keyboardType="numeric"
            leftIcon={<Ionicons name="time-outline" size={18} color={colors.textMuted} />} />

          {/* Difficulty */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Difficulty</Text>
          <View style={s.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[s.diffBtn, { backgroundColor: colors.card, borderColor: difficulty === d.value ? d.color : colors.border },
                  difficulty === d.value && { backgroundColor: d.color + '18' }]}
                onPress={() => setDifficulty(d.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={d.icon as any} size={20} color={difficulty === d.value ? d.color : colors.textMuted} />
                <Text style={[s.diffLabel, { color: difficulty === d.value ? d.color : colors.textMuted }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Schedule */}
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Schedule</Text>
          <View style={s.schedRow}>
            {SCHEDULES.map((sc) => (
              <TouchableOpacity
                key={sc.value}
                style={[s.schedBtn, { backgroundColor: colors.card, borderColor: schedule === sc.value ? colors.primary : colors.border },
                  schedule === sc.value && { backgroundColor: colors.primaryDim }]}
                onPress={() => setSchedule(sc.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={sc.icon as any} size={22} color={schedule === sc.value ? colors.primary : colors.textMuted} />
                <Text style={[s.schedLabel, { color: schedule === sc.value ? colors.primary : colors.textMuted }]}>{sc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* XP Preview */}
          <View style={[s.xpPreview, { backgroundColor: colors.yellowDim, borderColor: colors.yellow + '40' }]}>
            <View style={s.xpLeft}>
              <Ionicons name="flash" size={18} color={colors.yellow} />
              <Text style={[s.xpLabel, { color: colors.textSub }]}>Completing this task earns</Text>
            </View>
            <Text style={[s.xpVal, { color: colors.yellow }]}>{difficulty * 10}+ XP</Text>
          </View>

          <Button label="Create Task" onPress={handleCreate} loading={isPending} style={s.createBtn}
            icon={<Ionicons name="add-circle-outline" size={18} color="#fff" />} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.xl, fontWeight: '800' },
  sectionLabel: { fontSize: font.sm, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  diffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, minWidth: '28%', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: 4 },
  diffLabel: { fontSize: font.xs, fontWeight: '600', textAlign: 'center' },
  schedRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  schedBtn: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 6 },
  schedLabel: { fontSize: font.xs, fontWeight: '600' },
  xpPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1 },
  xpLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpLabel: { fontSize: font.sm },
  xpVal: { fontSize: font.xl, fontWeight: '800' },
  createBtn: { marginTop: spacing.sm },
});
