import { View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard, useWeeklyTrend } from '../hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import Companion from '@/components/Companion';
import WeeklyHeatmap from '@/components/WeeklyHeatmap';
import { font, spacing, radius, gradients } from '@/constants/theme';

const LEVEL_TITLES = ['Beginner', 'Apprentice', 'Consistent', 'Dedicated', 'Expert', 'Master', 'Legend', 'Mythic'];

const MILESTONES = [
  { label: '3-day streak',   target: 3,   icon: 'leaf-outline',        color: '#4ade80', type: 'streak' },
  { label: '7-day streak',   target: 7,   icon: 'flame-outline',       color: '#f97316', type: 'streak' },
  { label: '14-day streak',  target: 14,  icon: 'trending-up-outline', color: '#60a5fa', type: 'streak' },
  { label: '30-day streak',  target: 30,  icon: 'diamond-outline',     color: '#a78bfa', type: 'streak' },
  { label: 'Reach Level 5',  target: 5,   icon: 'star-outline',        color: '#fbbf24', type: 'level'  },
  { label: 'Reach Level 10', target: 10,  icon: 'trophy-outline',      color: '#fbbf24', type: 'level'  },
  { label: 'Earn 500 XP',    target: 500, icon: 'flash-outline',       color: '#fbbf24', type: 'xp'     },
];

function buildHeatmapWeeks(trendData: any[]): any[][] {
  if (!trendData || trendData.length === 0) return [];
  return trendData.map((week: any) => {
    const days = [];
    const start = new Date(week.week_start);
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      days.push({
        date: date.toISOString().split('T')[0],
        completions: d === 0 ? week.completions : 0,
        maxPossible: Math.max(week.completions + week.skips, 1),
      });
    }
    return days;
  });
}

export default function StatsScreen() {
  const { data, refetch } = useDashboard();
  const { data: trendData } = useWeeklyTrend(8);
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const level      = data?.level ?? 1;
  const xp         = data?.xp ?? 0;
  const streak     = data?.streak ?? 0;
  const ci         = data?.consistency_index ?? 0;
  const xpInLevel  = xp % 100;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(trendData?.weeks ?? []), [trendData]);

  const isAchieved = (m: typeof MILESTONES[0]) => {
    if (m.type === 'streak') return streak >= m.target;
    if (m.type === 'level')  return level >= m.target;
    if (m.type === 'xp')     return xp >= m.target;
    return false;
  };

  const wow      = trendData?.week_over_week;
  const wowDelta = wow?.completions_delta ?? 0;
  const ciDelta  = wow?.consistency_index_delta ?? 0;

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.md }}
      >
        <Text style={[s.pageTitle, { color: colors.text }]}>Statistics</Text>

        {/* ── Companion + Level Card ── */}
        <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.purple + '40' }]}>
          <LinearGradient colors={['#a78bfa10', '#a78bfa04']} style={StyleSheet.absoluteFill} />
          <Companion streak={streak} consistencyIndex={ci} level={level} size="lg" />
          <View style={s.heroInfo}>
            <Text style={[s.levelNum, { color: colors.purple }]}>Level {level}</Text>
            <Text style={[s.levelTitle, { color: colors.textMuted }]}>{levelTitle}</Text>
            <View style={s.heroStats}>
              <View style={[s.heroBadge, { backgroundColor: colors.yellow + '14' }]}>
                <Ionicons name="flash" size={12} color={colors.yellow} />
                <Text style={[s.heroBadgeTxt, { color: colors.yellow }]}>{xp} XP</Text>
              </View>
              <View style={[s.heroBadge, { backgroundColor: colors.primary + '14' }]}>
                <Ionicons name="flame" size={12} color={colors.primary} />
                <Text style={[s.heroBadgeTxt, { color: colors.primary }]}>{streak}d</Text>
              </View>
              {(data?.coins ?? 0) > 0 && (
                <View style={[s.heroBadge, { backgroundColor: colors.purple + '14' }]}>
                  <Ionicons name="diamond" size={11} color={colors.purple} />
                  <Text style={[s.heroBadgeTxt, { color: colors.purple }]}>{data?.coins}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Consistency Index ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.blue + '18' }]}>
              <Ionicons name="analytics" size={15} color={colors.blue} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Consistency Index</Text>
            <Text style={[s.sectionSub, { color: colors.blue }]}>{ci.toFixed(0)}/100</Text>
          </View>
          <View style={[s.track, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={ci >= 70 ? gradients.success : ci >= 40 ? gradients.xp : ['#f87171', '#ef4444']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.fill, { width: `${ci}%` }]}
            />
          </View>
          <Text style={[s.hint, { color: colors.textMuted }]}>
            {ci >= 80 ? 'Outstanding consistency!' : ci >= 50 ? 'Good — keep building' : 'Complete tasks daily to improve'}
          </Text>
        </View>

        {/* ── XP Progress ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.yellow + '18' }]}>
              <Ionicons name="flash" size={15} color={colors.yellow} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>XP Progress</Text>
            <Text style={[s.sectionSub, { color: colors.textMuted }]}>{xpInLevel}/100</Text>
          </View>
          <View style={[s.track, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={gradients.xp}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.fill, { width: `${xpInLevel}%` }]}
            />
          </View>
          <Text style={[s.hint, { color: colors.textMuted }]}>{100 - xpInLevel} XP to Level {level + 1}</Text>
        </View>

        {/* ── Streak Stats ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="flame" size={15} color={colors.primary} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Streak</Text>
          </View>
          <View style={s.streakCards}>
            {[
              { label: 'Current', value: streak,                    color: colors.primary, icon: 'flame'           },
              { label: 'Best',    value: data?.longest_streak ?? 0, color: colors.yellow,  icon: 'trophy'          },
              { label: 'Tasks',   value: data?.tasks?.length ?? 0,  color: colors.green,   icon: 'checkmark-circle'},
            ].map((item, i) => (
              <View key={i} style={[s.streakCard, { backgroundColor: colors.surface, borderColor: item.color + '30' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={[s.streakVal, { color: item.color }]}>{item.value}</Text>
                <Text style={[s.streakLbl, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Week-over-week delta ── */}
        {wow && (
          <View style={[s.section, {
            backgroundColor: ciDelta >= 0 ? colors.green + '10' : colors.red + '10',
            borderColor: ciDelta >= 0 ? colors.green + '30' : colors.red + '30',
          }]}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconWrap, { backgroundColor: (ciDelta >= 0 ? colors.green : colors.red) + '18' }]}>
                <Ionicons
                  name={ciDelta >= 0 ? 'trending-up' : 'trending-down'}
                  size={15}
                  color={ciDelta >= 0 ? colors.green : colors.red}
                />
              </View>
              <Text style={[s.sectionTitle, { color: colors.text }]}>This Week vs Last</Text>
            </View>
            <View style={s.wowRow}>
              <View style={s.wowItem}>
                <Text style={[s.wowVal, { color: wowDelta >= 0 ? colors.green : colors.red }]}>
                  {wowDelta >= 0 ? '+' : ''}{wowDelta}
                </Text>
                <Text style={[s.wowLbl, { color: colors.textMuted }]}>Completions</Text>
              </View>
              <View style={s.wowItem}>
                <Text style={[s.wowVal, { color: ciDelta >= 0 ? colors.green : colors.red }]}>
                  {ciDelta >= 0 ? '+' : ''}{ciDelta.toFixed(1)}
                </Text>
                <Text style={[s.wowLbl, { color: colors.textMuted }]}>CI Points</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Weekly Heatmap ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.purple + '18' }]}>
              <Ionicons name="calendar" size={15} color={colors.purple} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Activity Heatmap</Text>
          </View>
          <WeeklyHeatmap weeks={heatmapWeeks} />
        </View>

        {/* ── AI Suggestions ── */}
        {(data?.suggestions?.length ?? 0) > 0 && (
          <View style={[s.section, { backgroundColor: colors.blueDim, borderColor: colors.blue + '30' }]}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIconWrap, { backgroundColor: colors.blue + '18' }]}>
                <Ionicons name="bulb" size={15} color={colors.blue} />
              </View>
              <Text style={[s.sectionTitle, { color: colors.blue }]}>AI Suggestions</Text>
            </View>
            {data?.suggestions.map((sg: string, i: number) => (
              <View key={i} style={s.suggRow}>
                <Ionicons name="chevron-forward" size={14} color={colors.blue} />
                <Text style={[s.suggTxt, { color: colors.textSub }]}>{sg}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Milestones ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIconWrap, { backgroundColor: colors.yellow + '18' }]}>
              <Ionicons name="ribbon" size={15} color={colors.yellow} />
            </View>
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

  heroCard: {
    borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xl,
    marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden',
  },
  heroInfo:     { flex: 1 },
  levelNum:     { fontSize: font.xxl, fontWeight: '900' },
  levelTitle:   { fontSize: font.sm, marginTop: 2, marginBottom: spacing.sm },
  heroStats:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  heroBadgeTxt: { fontSize: font.xs, fontWeight: '700' },

  section:       { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: font.md, fontWeight: '700', flex: 1 },
  sectionSub:    { fontSize: font.xs, fontWeight: '600' },
  track:         { height: 10, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.sm },
  fill:          { height: '100%', borderRadius: radius.full },
  hint:          { fontSize: font.xs },

  streakCards: { flexDirection: 'row', gap: spacing.sm },
  streakCard:  { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, gap: 4 },
  streakVal:   { fontSize: font.xxl, fontWeight: '900' },
  streakLbl:   { fontSize: font.xs },

  wowRow:  { flexDirection: 'row', gap: spacing.lg },
  wowItem: { alignItems: 'center', gap: 2 },
  wowVal:  { fontSize: font.xl, fontWeight: '900' },
  wowLbl:  { fontSize: font.xs },

  suggRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: spacing.sm },
  suggTxt: { fontSize: font.sm, flex: 1 },

  milestone:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  milestoneIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  milestoneLbl:  { flex: 1, fontSize: font.sm, fontWeight: '600' },
});
