import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '@/features/tasks/hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { StaticXPBar } from '@/components/StaticXPBar';

export function ProgressScreen() {
  const { colors } = useTheme();
  const { data, isLoading } = useDashboard();

  const streak = data?.streak ?? 0;
  const level = data?.level ?? 1;
  const totalXP = data?.xp ?? 0;
  const xpInLevel = totalXP % 100;
  const xpToNext = 100;
  const completedToday = data?.total_completions ?? 0;
  const totalTasks = data?.tasks?.length ?? 0;

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <Text style={{ color: colors.text }}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <CText variant="heroTitle">Progress</CText>
          <CText variant="caption" tone="sub">Your consistency journey</CText>
        </View>

        {/* Level Card */}
        <Surface layer="bg1" rounded="xl" border style={s.card}>
          <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.primaryDim }]}>
              <Ionicons name="trophy" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <CText variant="sectionLabel" tone="primary">Level {level}</CText>
              <CText variant="caption" tone="sub">{totalXP} total XP earned</CText>
            </View>
          </View>
          <View style={{ marginTop: spacing[4] }}>
            <StaticXPBar level={level} xpInLevel={xpInLevel} xpToNext={xpToNext} />
          </View>
        </Surface>

        {/* Stats Grid */}
        <View style={s.grid}>
          {/* Streak */}
          <Surface layer="bg1" rounded="lg" border style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: colors.successDim }]}>
              <Ionicons name="flame" size={20} color={colors.success} />
            </View>
            <CText variant="heroNumber" style={{ marginTop: spacing[2] }}>{streak}</CText>
            <CText variant="caption" tone="sub">Day Streak</CText>
          </Surface>

          {/* Completed Today */}
          <Surface layer="bg1" rounded="lg" border style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: colors.primaryDim }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
            <CText variant="heroNumber" style={{ marginTop: spacing[2] }}>{completedToday}</CText>
            <CText variant="caption" tone="sub">Done Today</CText>
          </Surface>

          {/* Active Tasks */}
          <Surface layer="bg1" rounded="lg" border style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: colors.warningDim }]}>
              <Ionicons name="list" size={20} color={colors.warning} />
            </View>
            <CText variant="heroNumber" style={{ marginTop: spacing[2] }}>{totalTasks}</CText>
            <CText variant="caption" tone="sub">Active Tasks</CText>
          </Surface>

          {/* Total XP */}
          <Surface layer="bg1" rounded="lg" border style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: colors.primary2 + '22' }]}>
              <Ionicons name="flash" size={20} color={colors.primary2} />
            </View>
            <CText variant="heroNumber" style={{ marginTop: spacing[2] }}>{totalXP}</CText>
            <CText variant="caption" tone="sub">Total XP</CText>
          </Surface>
        </View>

        {/* Weekly Overview */}
        <Surface layer="bg1" rounded="xl" border style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.successDim }]}>
              <Ionicons name="calendar" size={24} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <CText variant="sectionLabel" tone="muted">This Week</CText>
              <CText variant="caption" tone="sub">7-day overview</CText>
            </View>
          </View>
          <View style={s.weekGrid}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <View key={i} style={s.dayBox}>
                <CText variant="micro" tone="sub">{day}</CText>
                <View
                  style={[
                    s.dayDot,
                    {
                      backgroundColor: i < 3 ? colors.success : colors.bg2,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </Surface>

        {/* Achievements */}
        <Surface layer="bg1" rounded="xl" border style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.warningDim }]}>
              <Ionicons name="star" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <CText variant="sectionLabel" tone="muted">Achievements</CText>
              <CText variant="caption" tone="sub">Milestones unlocked</CText>
            </View>
          </View>
          <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
            <View style={s.achievement}>
              <View style={[s.achievementIcon, { backgroundColor: colors.successDim }]}>
                <Ionicons name="checkmark-done" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <CText variant="body">First Task</CText>
                <CText variant="caption" tone="sub">Completed your first mission</CText>
              </View>
            </View>
            {streak >= 3 && (
              <View style={s.achievement}>
                <View style={[s.achievementIcon, { backgroundColor: colors.primaryDim }]}>
                  <Ionicons name="flame" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <CText variant="body">3-Day Streak</CText>
                  <CText variant="caption" tone="sub">Consistency is building</CText>
                </View>
              </View>
            )}
            {level >= 2 && (
              <View style={s.achievement}>
                <View style={[s.achievementIcon, { backgroundColor: colors.warningDim }]}>
                  <Ionicons name="trophy" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <CText variant="body">Level 2</CText>
                  <CText variant="caption" tone="sub">Leveled up!</CText>
                </View>
              </View>
            )}
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing[5], paddingBottom: spacing[20], gap: spacing[4] },
  header: { gap: spacing[1], marginBottom: spacing[2] },
  card: { padding: spacing[5], overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  statCard: { width: '48%', padding: spacing[4], alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[4] },
  dayBox: { alignItems: 'center', gap: spacing[2] },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  achievement: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  achievementIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
