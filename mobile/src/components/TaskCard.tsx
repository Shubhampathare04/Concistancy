import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius } from '@/constants/theme';
import { Task } from '@/features/tasks/types';

interface Props {
  task: Task;
  onComplete: (id: number) => void;
  completing?: boolean;
}

const difficultyMeta = (d: number) => {
  if (d === 1) return { label: 'Very Easy', color: '#4ade80' };
  if (d === 2) return { label: 'Easy', color: '#86efac' };
  if (d === 3) return { label: 'Medium', color: '#fbbf24' };
  if (d === 4) return { label: 'Hard', color: '#f97316' };
  return { label: 'Extreme', color: '#f87171' };
};

const scheduleIcon = (s: string) => {
  if (s === 'daily') return 'repeat';
  if (s === 'weekly') return 'calendar-outline';
  return 'flag-outline';
};

export default function TaskCard({ task, onComplete, completing }: Props) {
  const { colors } = useTheme();
  const diff = difficultyMeta(task.difficulty);

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[s.diffBar, { backgroundColor: diff.color }]} />
      <View style={s.body}>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
        <View style={s.meta}>
          <View style={[s.badge, { backgroundColor: diff.color + '22' }]}>
            <Text style={[s.badgeTxt, { color: diff.color }]}>{diff.label}</Text>
          </View>
          <View style={s.metaItem}>
            <Ionicons name={scheduleIcon(task.schedule_type) as any} size={11} color={colors.textMuted} />
            <Text style={[s.metaTxt, { color: colors.textMuted }]}>{task.schedule_type}</Text>
          </View>
          {task.estimated_minutes && (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={[s.metaTxt, { color: colors.textMuted }]}>{task.estimated_minutes}m</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[s.doneBtn, { backgroundColor: completing ? colors.border : colors.green }]}
        onPress={() => onComplete(task.id)}
        disabled={completing}
        activeOpacity={0.7}
      >
        {completing
          ? <ActivityIndicator size="small" color={colors.textMuted} />
          : <Ionicons name="checkmark" size={20} color="#000" />
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, marginBottom: spacing.sm, overflow: 'hidden', borderWidth: 1 },
  diffBar: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: spacing.md },
  title: { fontSize: font.md, fontWeight: '600', marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeTxt: { fontSize: font.xs, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt: { fontSize: font.xs, textTransform: 'capitalize' },
  doneBtn: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
});
