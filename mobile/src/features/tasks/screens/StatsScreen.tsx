import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '../hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { font, spacing, radius } from '@/constants/theme';

const LEVEL_TITLES = ['Beginner', 'Apprentice', 'Consistent', 'Dedicated', 'Expert', 'Master', 'Legend', 'Mythic'];

const MILESTONES = [
  { label: '3-day streak', target: 3, icon: 'leaf-outline', color: '#4ade80', type: 'streak' },
  { label: '7-day streak', target: 7, icon: 'flame-outline', color: '#f97316', type: 'streak' },
  { label: '14-day streak', target: 14, icon: 'trending-up-outline', color: '#60a5fa', type: 'streak' },
  { label: '30-day streak', target: 30, icon: 'diamond-outline', color: '#a78bfa', type: 'streak' },
  { label: 'Reach Level 5', target: 5, icon: 'star-outline', color: '#fbbf24', type: 'level' },
  { label: 'Reach Level 10', target: 10, icon: 'trophy-outline', color: '#fbbf24', type: 'level' },
  { label: 'Earn 500 XP', target: 500, icon: 'flash-outline', color: '#fbbf24', type: 'xp' },
];

export default function StatsScreen() {
  const { data, refetch } = useDashboard();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const streak = data?.streak ?? 0;
  const xpInLevel = xp % 100;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const isAchieved = (m: typeof MILESTONES[0]) => {
    if (m.type === 'streak') return streak >= m.target;
    if (m.type === 'level') return level >= m.target;
    if (m.type === 'xp') return xp >= m.target;
    return false;
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        <Text style={[s.pageTitle, { color: colors.text }]}>Statistics</Text>

        {/* Level Card */}
        <View style={[s.levelCard, { backgroundColor: colors.card, borderColor: colors.purple + '40' }]}>
          <View style={[s.levelIconWrap, { backgroundColor: colors.purpleDim }]}>
            <Ionicons name="shield-checkmark" size={28} color={colors.purple} />
          </View>
          <View style={s.levelInfo}>
            <Text style={[s.levelNum, { color: colors.purple }]}>Level {level}</Text>
            <Text style={[s.levelTitle, { color: colors.textMuted }]}>{levelTitle}</Text>
          </View>
          <View style={s.levelRight}>
            <Text style={[s.totalXp, { color: colors.yellow }]}>{xp}</Text>
            <Text style={[s.xpSub, { color: colors.textDim }]}>Total XP</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="flash" size={16} color={colors.yellow} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>XP Progress</Text>
            <Text style={[s.sectionSub, { color: colors.textMuted }]}>{xpInLevel}/100</Text>
          </View>
          <View style={[s.track, { backgroundColor: colors.surface }]}>
            <View style={[s.fill, { width: `${xpInLevel}%`, backgroundColor: colors.yellow }]} />
          </View>
          <Text style={[s.hint, { color: colors.textDim }]}>{100 - xpInLevel} XP to Level {level + 1}</Text>
        </View>

        {/* Streak Stats */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="flame" size={16} color={colors.primary} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>Streak</Text>
          </View>
          <View style={s.streakCards}>
            {[
              { label: 'Current', value: streak, color: colors.primary, icon: 'flame' },
              { label: 'Best', value: streak, color: colors.yellow, icon: 'trophy' },
              { label: 'Tasks', value: data?.tasks?.length ?? 0, color: colors.green, icon: 'checkmark-circle' },
            ].map((item, i) => (
              <View key={i} style={[s.streakCard, { backgroundColor: colors.surface, borderColor: item.color + '30' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={[s.streakVal, { color: item.color }]}>{item.value}</Text>
                <Text style={[s.streakLbl, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Suggestions */}
        {(data?.suggestions?.length ?? 0) > 0 && (
          <View style={[s.section, { backgroundColor: colors.blueDim, borderColor: colors.blue + '30' }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="bulb" size={16} color={colors.blue} />
              <Text style={[s.sectionTitle, { color: colors.blue }]}>AI Suggestions</Text>
            </View>
            {data?.suggestions.map((sg, i) => (
              <View key={i} style={s.suggRow}>
                <Ionicons name="chevron-forward" size={14} color={colors.blue} />
                <Text style={[s.suggTxt, { color: colors.textSub }]}>{sg}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Milestones */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="ribbon" size={16} color={colors.yellow} />
            <Text style={[s.sectionTitle, { color: colors.text }]}>Milestones</Text>
          </View>
          {MILESTONES.map((m, i) => {
            const achieved = isAchieved(m);
            return (
              <View key={i} style={[s.milestone, { borderBottomColor: colors.border }, i === MILESTONES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.milestoneIcon, { backgroundColor: achieved ? m.color + '22' : colors.surface }]}>
                  <Ionicons name={m.icon as any} size={18} color={achieved ? m.color : colors.textDim} />
                </View>
                <Text style={[s.milestoneLbl, { color: achieved ? colors.text : colors.textMuted }]}>{m.label}</Text>
                {achieved
                  ? <Ionicons name="checkmark-circle" size={20} color={m.color} />
                  : <Ionicons name="lock-closed-outline" size={16} color={colors.textDim} />
                }
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.lg },
  levelCard: { borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  levelIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelInfo: { flex: 1 },
  levelNum: { fontSize: font.xxl, fontWeight: '900' },
  levelTitle: { fontSize: font.sm, marginTop: 2 },
  levelRight: { alignItems: 'flex-end' },
  totalXp: { fontSize: font.xl, fontWeight: '800' },
  xpSub: { fontSize: font.xs },
  section: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionTitle: { fontSize: font.md, fontWeight: '700', flex: 1 },
  sectionSub: { fontSize: font.xs },
  track: { height: 10, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.sm },
  fill: { height: '100%', borderRadius: radius.full },
  hint: { fontSize: font.xs },
  streakCards: { flexDirection: 'row', gap: spacing.sm },
  streakCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, gap: 4 },
  streakVal: { fontSize: font.xxl, fontWeight: '900' },
  streakLbl: { fontSize: font.xs },
  suggRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: spacing.sm },
  suggTxt: { fontSize: font.sm, flex: 1 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  milestoneIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  milestoneLbl: { flex: 1, fontSize: font.sm, fontWeight: '600' },
});
