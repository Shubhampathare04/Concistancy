import { memo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { radius, shadow, spacing } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import type { Task } from '@/features/tasks/types';

type Props = {
  task: Task;
  onComplete: (taskId: number) => void;
  onSkip: (taskId: number) => void;
  disabled?: boolean;
  onFocus?: (task: Task) => void;
  completing?: boolean;
};

export const TaskCard = memo(function TaskCard({ task, onComplete, onSkip, disabled }: Props) {
  const { colors } = useTheme();
  const difficulty = Math.max(1, Math.min(5, task.difficulty || 3));
  const xp = difficulty * 10;
  const label = difficulty <= 2 ? 'Quick win' : difficulty === 3 ? 'Steady' : difficulty === 4 ? 'Hard' : 'Boss';
  const tint = difficulty <= 2 ? colors.success : difficulty === 3 ? colors.warning : difficulty === 4 ? colors.primary2 : colors.error;

  return (
    <View style={s.container}>
      <Surface layer="bg1" rounded="lg" border style={[s.card, shadow.sm]}>
        <LinearGradient colors={[tint + '18', 'transparent']} style={StyleSheet.absoluteFill} />
        
        <View style={s.top}>
          <View style={s.dotWrap}>
            <View style={[s.dot, { backgroundColor: tint }]} />
          </View>
          <CText variant="micro" tone="sub">{label}</CText>
          <View style={{ flex: 1 }} />
          <Surface layer="bg2" rounded="pill" border style={s.xpBadge}>
            <Ionicons name="flash" size={14} color={colors.warning} />
            <CText variant="micro" tone="sub">{`${xp}`}</CText>
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

        <View style={s.actions}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.success }]}
            onPress={() => onComplete(task.id)}
            disabled={disabled}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <CText variant="micro" style={{ color: '#fff' }}>Done</CText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.bg2 }]}
            onPress={() => onSkip(task.id)}
            disabled={disabled}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.textSub} />
            <CText variant="micro" tone="sub">Later</CText>
          </TouchableOpacity>
        </View>
      </Surface>
    </View>
  );
});

export default TaskCard;

const s = StyleSheet.create({
  container: { marginBottom: spacing[3] },
  card: { padding: spacing[5], gap: spacing[2] },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  dotWrap: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  title: { marginTop: spacing[1] },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.md },
});
