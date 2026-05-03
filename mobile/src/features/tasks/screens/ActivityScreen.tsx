/**
 * ActivityScreen
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows WHAT the user did and WHEN — a chronological activity feed.
 * Distinct from StatsScreen (which shows aggregated numbers/charts).
 *
 * Sections:
 *  1. Today's summary ring
 *  2. 30-day streak calendar (GitHub-style)
 *  3. Recent completions timeline
 *  4. Best performance windows (best hour, best day)
 */
import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard, useWeeklyTrend } from '../hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import ProgressRing from '@/components/ProgressRing';
import { font, spacing, radius, gradients } from '@/constants/theme';

const SCREEN_W = Dimensions.get('window').width;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const HOUR_BLOCKS = [
  { label: 'Early Bird',  range: '5–9 AM',   icon: 'sunny-outline',      color: '#fbbf24' },
  { label: 'Morning',     range: '9–12 PM',  icon: 'partly-sunny-outline', color: '#f97316' },
  { label: 'Afternoon',   range: '12–5 PM',  icon: 'cloud-outline',       color: '#60a5fa' },
  { label: 'Evening',     range: '5–9 PM',   icon: 'moon-outline',        color: '#a78bfa' },
  { label: 'Night Owl',   range: '9 PM–5 AM',icon: 'star-outline',        color: '#34d399' },
];

function getHourBlock(hour: number | null) {
  if (hour === null) return null;
  if (hour >= 5  && hour < 9)  return HOUR_BLOCKS[0];
  if (hour >= 9  && hour < 12) return HOUR_BLOCKS[1];
  if (hour >= 12 && hour < 17) return HOUR_BLOCKS[2];
  if (hour >= 17 && hour < 21) return HOUR_BLOCKS[3];
  return HOUR_BLOCKS[4];
}

// Build a 30-day calendar grid from weekly trend data
function build30DayGrid(weeks: any[]): { date: string; count: number; intensity: number }[] {
  const grid: { date: string; count: number; intensity: number }[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Find matching week data
    let count = 0;
    for (const week of weeks) {
      const weekStart = new Date(week.week_start);
      const weekEnd   = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (d >= weekStart && d <= weekEnd) {
        // Distribute completions evenly across the week (approximation)
        count = Math.round(week.completions / 7);
        break;
      }
    }

    const maxPerDay = 5;
    grid.push({ date: dateStr, count, intensity: Math.min(count / maxPerDay, 1) });
  }
  return grid;
}

function intensityColor(intensity: number, primary: string): string {
  if (intensity === 0) return 'transparent';
  if (intensity < 0.25) return primary + '30';
  if (intensity < 0.5)  return primary + '55';
  if (intensity < 0.75) return primary + '88';
  return primary + 'cc';
}

export default function ActivityScreen() {
  const { data, refetch } = useDashboard();
  const { data: trendData } = useWeeklyTrend(8);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const streak     = data?.streak ?? 0;
  const xp         = data?.xp ?? 0;
  const tasks      = data?.tasks ?? [];
  const ci         = data?.consistency_index ?? 0;
  const total      = data?.total_completions ?? 0;

  const weeks = trendData?.weeks ?? [];
  const grid  = useMemo(() => build30DayGrid(weeks), [weeks]);

  // Today's progress
  const todayDone    = data?.total_completions ?? 0;
  const todayTarget  = Math.max(tasks.length + todayDone, 1);
  const todayPct     = Math.min(todayDone / todayTarget, 1);

  // Best hour block from consistency report
  const bestHour = trendData?.best_hour_of_day ?? null;
  const hourBlock = getHourBlock(bestHour);

  // Weekly completions for bar chart
  const weekBars = weeks.slice(-7).map((w: any) => ({
    label: new Date(w.week_start).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: w.completions,
    rate:  w.completion_rate,
  }));
  const maxBar = Math.max(...weekBars.map((b: any) => b.value), 1);

  // Recent activity items (synthesized from available data)
  const recentItems = useMemo(() => {
    const items = [];
    // Completed tasks today
    for (let i = 0; i < Math.min(todayDone, 5); i++) {
      const task = tasks[i];
      items.push({
        id: i,
        type: 'completion',
        title: task ? `Completed "${task.title}"` : 'Completed a task',
        time: 'Today',
        icon: 'checkmark-circle',
        color: '#34d399',
      });
    }
    if (streak > 0) {
      items.push({
        id: 99,
        type: 'streak',
        title: `${streak}-day streak active`,
        time: 'Ongoing',
        icon: 'flame',
        color: colors.primary,
      });
    }
    if (xp > 0) {
      items.push({
        id: 100,
        type: 'xp',
        title: `${xp} total XP earned`,
        time: 'All time',
        icon: 'flash',
        color: colors.yellow,
      });
    }
    return items;
  }, [tasks, todayDone, streak, xp]);

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={[s.pageTitle, { color: colors.text }]}>Activity</Text>

        {/* ── Today Summary ── */}
        <View style={[s.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={['#ff6b3510', '#ff6b3504']} style={StyleSheet.absoluteFill} />
          <View style={s.todayLeft}>
            <Text style={[s.todayLabel, { color: colors.textMuted }]}>TODAY</Text>
            <Text style={[s.todayTitle, { color: colors.text }]}>
              {todayDone === 0 ? "Let's get started" : todayDone === 1 ? 'First task done!' : `${todayDone} tasks done`}
            </Text>
            <View style={s.todayStats}>
              <View style={[s.todayBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                <Ionicons name="flame" size={11} color={colors.primary} />
                <Text style={[s.todayBadgeTxt, { color: colors.primary }]}>{streak}d streak</Text>
              </View>
              <View style={[s.todayBadge, { backgroundColor: colors.yellow + '18', borderColor: colors.yellow + '30' }]}>
                <Ionicons name="flash" size={11} color={colors.yellow} />
                <Text style={[s.todayBadgeTxt, { color: colors.yellow }]}>{xp} XP</Text>
              </View>
            </View>
          </View>
          <ProgressRing size={80} strokeWidth={6} progress={todayPct} color={colors.primary} trackColor={colors.border}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.ringNum, { color: colors.primary }]}>{todayDone}</Text>
              <Text style={[s.ringLbl, { color: colors.textMuted }]}>done</Text>
            </View>
          </ProgressRing>
        </View>

        {/* ── 30-Day Activity Calendar ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: colors.purple + '18' }]}>
              <Ionicons name="calendar" size={14} color={colors.purple} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>30-Day Activity</Text>
            <Text style={[s.sectionSub, { color: colors.textMuted }]}>
              {grid.filter(d => d.count > 0).length} active days
            </Text>
          </View>

          {/* Day labels */}
          <View style={s.calDayRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={[s.calDayLbl, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* Grid — 30 days in rows of 7 */}
          <View style={s.calGrid}>
            {grid.map((day, i) => {
              const isSelected = selectedDay === day.date;
              const bg = isSelected ? colors.primary : intensityColor(day.intensity, colors.primary);
              const border = isSelected ? colors.primary : day.count > 0 ? colors.primary + '30' : colors.border;
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.calCell, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => setSelectedDay(isSelected ? null : day.date)}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>

          {/* Selected day detail */}
          {selectedDay && (() => {
            const d = grid.find(g => g.date === selectedDay);
            const dateObj = new Date(selectedDay);
            return (
              <View style={[s.calDetail, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                <Text style={[s.calDetailTxt, { color: colors.textSub }]}>
                  {dateObj.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  {' — '}
                  <Text style={{ color: d?.count ? colors.green : colors.textMuted, fontWeight: '700' }}>
                    {d?.count ?? 0} completion{d?.count !== 1 ? 's' : ''}
                  </Text>
                </Text>
              </View>
            );
          })()}

          {/* Legend */}
          <View style={s.calLegend}>
            <Text style={[s.calLegendTxt, { color: colors.textMuted }]}>Less</Text>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <View key={i} style={[s.calLegendCell, {
                backgroundColor: v === 0 ? colors.border : intensityColor(v, colors.primary),
                borderColor: v === 0 ? colors.border : colors.primary + '30',
              }]} />
            ))}
            <Text style={[s.calLegendTxt, { color: colors.textMuted }]}>More</Text>
          </View>
        </View>

        {/* ── Weekly Bar Chart ── */}
        {weekBars.length > 0 && (
          <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIcon, { backgroundColor: colors.blue + '18' }]}>
                <Ionicons name="bar-chart" size={14} color={colors.blue} />
              </View>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Weekly Completions</Text>
            </View>
            <View style={s.barChart}>
              {weekBars.map((bar: any, i: number) => {
                const h = Math.max((bar.value / maxBar) * 100, 4);
                const color = bar.rate >= 0.8 ? '#34d399' : bar.rate >= 0.5 ? colors.yellow : colors.primary;
                return (
                  <View key={i} style={s.barCol}>
                    <Text style={[s.barVal, { color: colors.textMuted }]}>{bar.value}</Text>
                    <View style={[s.barTrack, { backgroundColor: colors.surface }]}>
                      <LinearGradient
                        colors={[color, color + '80']}
                        style={[s.barFill, { height: `${h}%` }]}
                      />
                    </View>
                    <Text style={[s.barLbl, { color: colors.textMuted }]}>{bar.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Performance Windows ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: colors.yellow + '18' }]}>
              <Ionicons name="time" size={14} color={colors.yellow} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Performance Windows</Text>
          </View>
          <View style={s.windowGrid}>
            {HOUR_BLOCKS.map((block, i) => {
              const isActive = hourBlock ? i === HOUR_BLOCKS.indexOf(hourBlock) : false;
              return (
                <View key={i} style={[s.windowCard, {
                  backgroundColor: isActive ? block.color + '15' : colors.surface,
                  borderColor: isActive ? block.color + '40' : colors.border,
                }]}>
                  <Ionicons name={block.icon as any} size={18} color={isActive ? block.color : colors.textDim} />
                  <Text style={[s.windowLabel, { color: isActive ? block.color : colors.textMuted }]}>{block.label}</Text>
                  <Text style={[s.windowRange, { color: colors.textMuted }]}>{block.range}</Text>
                  {isActive && (
                    <View style={[s.windowBest, { backgroundColor: block.color + '20' }]}>
                      <Text style={[s.windowBestTxt, { color: block.color }]}>Best</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Recent Activity Feed ── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: colors.green + '18' }]}>
              <Ionicons name="pulse" size={14} color={colors.green} />
            </View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          </View>

          {recentItems.length === 0 ? (
            <View style={s.emptyFeed}>
              <Ionicons name="hourglass-outline" size={32} color={colors.textDim} />
              <Text style={[s.emptyFeedTxt, { color: colors.textMuted }]}>No activity yet today</Text>
              <Text style={[s.emptyFeedSub, { color: colors.textDim }]}>Complete tasks to see your feed</Text>
            </View>
          ) : (
            recentItems.map((item, i) => (
              <View key={item.id} style={[s.feedItem, { borderBottomColor: colors.border }, i === recentItems.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.feedDot, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                </View>
                {i < recentItems.length - 1 && (
                  <View style={[s.feedLine, { backgroundColor: colors.border }]} />
                )}
                <View style={s.feedBody}>
                  <Text style={[s.feedTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.feedTime, { color: colors.textMuted }]}>{item.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Consistency Score ── */}
        <View style={[s.ciCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={ci >= 70 ? ['#34d39915', '#34d39905'] : ci >= 40 ? ['#fbbf2415', '#fbbf2405'] : ['#f8717115', '#f8717105']}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.ciLeft}>
            <Text style={[s.ciLabel, { color: colors.textMuted }]}>CONSISTENCY SCORE</Text>
            <Text style={[s.ciVal, { color: ci >= 70 ? '#34d399' : ci >= 40 ? colors.yellow : colors.red }]}>
              {ci.toFixed(0)}
            </Text>
            <Text style={[s.ciSub, { color: colors.textMuted }]}>out of 100</Text>
          </View>
          <View style={s.ciRight}>
            <ProgressRing
              size={72}
              strokeWidth={6}
              progress={ci / 100}
              color={ci >= 70 ? '#34d399' : ci >= 40 ? colors.yellow : colors.red}
              trackColor={colors.border}
            >
              <Ionicons
                name={ci >= 70 ? 'shield-checkmark' : ci >= 40 ? 'shield-outline' : 'shield'}
                size={22}
                color={ci >= 70 ? '#34d399' : ci >= 40 ? colors.yellow : colors.red}
              />
            </ProgressRing>
            <Text style={[s.ciStatus, {
              color: ci >= 70 ? '#34d399' : ci >= 40 ? colors.yellow : colors.red,
            }]}>
              {ci >= 80 ? 'Outstanding' : ci >= 60 ? 'Strong' : ci >= 40 ? 'Building' : 'At Risk'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const CELL_SIZE = Math.floor((SCREEN_W - 36 - 32 - 6 * 4) / 7);

const s = StyleSheet.create({
  pageTitle: { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.lg },

  // Today card
  todayCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden',
  },
  todayLeft:     { flex: 1 },
  todayLabel:    { fontSize: font.xs, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  todayTitle:    { fontSize: font.lg, fontWeight: '800', marginBottom: 10 },
  todayStats:    { flexDirection: 'row', gap: 8 },
  todayBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  todayBadgeTxt: { fontSize: font.xs, fontWeight: '700' },
  ringNum:       { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  ringLbl:       { fontSize: 9, fontWeight: '600' },

  // Section
  section:       { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  sectionIcon:   { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: font.md, fontWeight: '700', flex: 1 },
  sectionSub:    { fontSize: font.xs, fontWeight: '600' },

  // Calendar
  calDayRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calDayLbl:  { fontSize: 10, fontWeight: '600', width: CELL_SIZE, textAlign: 'center' },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calCell:    { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 4, borderWidth: 1 },
  calDetail:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, borderRadius: radius.md, borderWidth: 1 },
  calDetailTxt: { fontSize: font.xs },
  calLegend:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' },
  calLegendTxt: { fontSize: 10 },
  calLegendCell: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },

  // Bar chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 },
  barCol:   { flex: 1, alignItems: 'center', gap: 4 },
  barVal:   { fontSize: 9, fontWeight: '600' },
  barTrack: { flex: 1, width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:  { width: '100%', borderRadius: 4 },
  barLbl:   { fontSize: 8, fontWeight: '500', textAlign: 'center' },

  // Performance windows
  windowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  windowCard: {
    width: (SCREEN_W - 36 - 32 - 8) / 2 - 4,
    borderRadius: radius.lg, borderWidth: 1,
    padding: 12, gap: 3, position: 'relative',
  },
  windowLabel: { fontSize: font.sm, fontWeight: '700' },
  windowRange: { fontSize: font.xs },
  windowBest:  { position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  windowBestTxt: { fontSize: 9, fontWeight: '800' },

  // Feed
  emptyFeed:    { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyFeedTxt: { fontSize: font.md, fontWeight: '600' },
  emptyFeedSub: { fontSize: font.sm },
  feedItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, position: 'relative' },
  feedDot:   { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, zIndex: 1 },
  feedLine:  { position: 'absolute', left: 15, top: 44, bottom: -12, width: 2 },
  feedBody:  { flex: 1, paddingTop: 4 },
  feedTitle: { fontSize: font.sm, fontWeight: '600', marginBottom: 2 },
  feedTime:  { fontSize: font.xs },

  // CI card
  ciCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden',
  },
  ciLeft:   { flex: 1 },
  ciLabel:  { fontSize: font.xs, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  ciVal:    { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  ciSub:    { fontSize: font.xs, fontWeight: '500', marginTop: 2 },
  ciRight:  { alignItems: 'center', gap: 6 },
  ciStatus: { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.5 },
});
