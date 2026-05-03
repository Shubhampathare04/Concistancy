import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useDashboard, useCompleteTask } from '../hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import TaskCard from '@/components/TaskCard';
import XPGainToast from '@/components/XPGainToast';
import RewardModal from '@/components/RewardModal';
import Companion from '@/components/Companion';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import { HomeHeaderSkeleton, TaskCardSkeleton } from '@/components/SkeletonLoader';
import { usePulse } from '@/hooks/usePulse';
import { useAnimatedPress } from '@/hooks/useAnimatedPress';
import { font, spacing, radius, gradients, glow, shadow } from '@/constants/theme';
import { Task, AIInsight, CompleteTaskResult } from '../types';

const INSIGHT_META: Record<string, { icon: string; label: string; colorKey: string }> = {
  warning:     { icon: 'warning-outline',  label: 'Heads Up',    colorKey: 'red'    },
  suggestion:  { icon: 'bulb-outline',     label: 'AI Insight',  colorKey: 'blue'   },
  achievement: { icon: 'trophy-outline',   label: 'Achievement', colorKey: 'yellow' },
};

interface RewardState {
  visible: boolean; xpGained: number; newStreak: number;
  levelUp: boolean; newLevel: number; coinsGained: number;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function streakLabel(streak: number) {
  if (streak === 0) return 'Start your streak today';
  if (streak < 3)  return 'Great start, keep going';
  if (streak < 7)  return 'Building momentum';
  if (streak < 14) return "You're on fire";
  if (streak < 30) return 'Unstoppable force';
  return 'Legendary status';
}

export default function HomeScreen() {
  const { data, isLoading, refetch } = useDashboard();
  const { mutate: complete, isPending, variables } = useCompleteTask();
  const user       = useAuthStore((s) => s.user);
  const nav        = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [xpToast, setXpToast]       = useState<{ xp: number; key: number } | null>(null);
  const [reward, setReward]         = useState<RewardState>({
    visible: false, xpGained: 0, newStreak: 0, levelUp: false, newLevel: 1, coinsGained: 0,
  });

  const xpBarAnim   = useRef(new Animated.Value(0)).current;
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide   = useRef(new Animated.Value(24)).current;
  const prevXpRef   = useRef(0);

  const streak     = data?.streak ?? 0;
  const pulseDur   = streak >= 30 ? 550 : streak >= 7 ? 850 : 1300;
  const flamePulse = usePulse(0.88, 1.0, pulseDur);
  const addPress   = useAnimatedPress({ scale: 0.9 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(heroSlide,   { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const xpInLevel = (data?.xp ?? 0) % 100;
    const target    = xpInLevel / 100;
    if (target !== prevXpRef.current) {
      Animated.spring(xpBarAnim, { toValue: target, tension: 55, friction: 9, useNativeDriver: false }).start();
      prevXpRef.current = target;
    }
  }, [data?.xp]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
    { useNativeDriver: true }
  );

  const headerTranslate = headerAnim.interpolate({ inputRange: [0, 100], outputRange: [0, -30], extrapolate: 'clamp' });
  const headerOpacity   = headerAnim.interpolate({ inputRange: [0, 80],  outputRange: [1, 0],   extrapolate: 'clamp' });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await refetch();
    setRefreshing(false);
  };

  const handleComplete = useCallback((taskId: number) => {
    const task        = data?.tasks.find((t) => t.id === taskId);
    const estimatedXp = task ? task.difficulty * 10 : 10;
    complete({ taskId }, {
      onSuccess: (result: CompleteTaskResult) => {
        const xp = result.status === 'queued' ? estimatedXp : result.xp_gained;
        if (xp > 0) setXpToast({ xp, key: Date.now() });
        setTimeout(() => {
          setReward({
            visible: true, xpGained: xp,
            newStreak:   result.new_streak  || streak + 1,
            levelUp:     result.level_up   ?? false,
            newLevel:    result.new_level  ?? (data?.level ?? 1),
            coinsGained: task?.difficulty ?? 1,
          });
        }, 350);
      },
    });
  }, [complete, data?.tasks, data?.level, streak]);

  const handleFocusMode = useCallback((task: Task) => {
    nav.navigate('FocusMode', { task });
  }, [nav]);

  const xpInLevel  = (data?.xp ?? 0) % 100;
  const xpProgress = xpInLevel / 100;
  const level      = data?.level ?? 1;
  const tasks      = data?.tasks ?? [];

  const insights: AIInsight[] = data?.insights?.length
    ? data.insights
    : (data?.suggestions ?? []).map((s, i) => ({ type: 'suggestion' as const, message: s, priority: i + 1 }));

  const completedToday = data?.total_completions ?? 0;
  const taskCount      = tasks.length;

  if (isLoading) {
    return (
      <ScreenWrapper padded={false}>
        <HomeHeaderSkeleton />
        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
          {[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {xpToast && <XPGainToast key={xpToast.key} xp={xpToast.xp} onDone={() => setXpToast(null)} />}
      <RewardModal
        visible={reward.visible}
        xpGained={reward.xpGained}
        newStreak={reward.newStreak}
        levelUp={reward.levelUp}
        newLevel={reward.newLevel}
        coinsGained={reward.coinsGained}
        onClose={() => setReward((r) => ({ ...r, visible: false }))}
      />

      <Animated.FlatList
        data={tasks}
        keyExtractor={(item: Task) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroSlide }] }}>

            {/* ── Top Bar ── */}
            <Animated.View style={[s.topBar, { transform: [{ translateY: headerTranslate }], opacity: headerOpacity }]}>
              <View>
                <Text style={[s.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
                <Text style={[s.name, { color: colors.text }]}>{user?.name ?? 'Champion'}</Text>
              </View>
              <View style={s.topRight}>
                <SyncStatusBadge compact />
                <TouchableOpacity
                  style={[s.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => nav.navigate('Search')}
                >
                  <Ionicons name="search-outline" size={18} color={colors.textSub} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => nav.navigate('Profile')}
                >
                  <Ionicons name="person-outline" size={18} color={colors.textSub} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Hero Banner ── */}
            <View style={[s.heroBanner, shadow.lg]}>
              <LinearGradient
                colors={isDark
                  ? ['#1a0a00', '#2a1200', '#1a0a00']
                  : ['#fff3ee', '#ffe8dc', '#fff3ee']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[s.glowOrb, { backgroundColor: colors.primary + '20' }]} />

              <View style={s.heroContent}>
                <View style={s.heroLeft}>
                  <Companion streak={streak} consistencyIndex={data?.consistency_index ?? 0} level={level} size="lg" />
                </View>

                <View style={s.heroCenter}>
                  <Animated.View style={{ transform: [{ scale: flamePulse }] }}>
                    <Text style={[s.heroStreakNum, { color: colors.primary }]}>{streak}</Text>
                  </Animated.View>
                  <Text style={[s.heroStreakLabel, { color: colors.textMuted }]}>DAY STREAK</Text>
                  <Text style={[s.heroMotivation, { color: colors.text }]}>{streakLabel(streak)}</Text>
                </View>

                <View style={s.heroRight}>
                  {/* Level badge */}
                  <LinearGradient colors={gradients.primary} style={s.levelBadge}>
                    <Ionicons name="star" size={11} color="#fff" />
                    <Text style={s.levelBadgeTxt}>Lv {level}</Text>
                  </LinearGradient>

                  {/* Best streak */}
                  <View style={[s.heroBadge, { backgroundColor: colors.yellow + '18', borderColor: colors.yellow + '30' }]}>
                    <Ionicons name="trophy-outline" size={10} color={colors.yellow} />
                    <Text style={[s.heroBadgeTxt, { color: colors.yellow }]}>Best {data?.longest_streak ?? 0}d</Text>
                  </View>

                  {/* Coins */}
                  {(data?.coins ?? 0) > 0 && (
                    <View style={[s.heroBadge, { backgroundColor: colors.purple + '18', borderColor: colors.purple + '30' }]}>
                      <Ionicons name="diamond-outline" size={10} color={colors.purple} />
                      <Text style={[s.heroBadgeTxt, { color: colors.purple }]}>{data?.coins}</Text>
                    </View>
                  )}

                  {/* CI score */}
                  {(data?.consistency_index ?? 0) > 0 && (
                    <View style={[s.heroBadge, { backgroundColor: colors.blue + '18', borderColor: colors.blue + '30' }]}>
                      <Ionicons name="analytics-outline" size={10} color={colors.blue} />
                      <Text style={[s.heroBadgeTxt, { color: colors.blue }]}>{data?.consistency_index.toFixed(0)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ── XP Progress Bar ── */}
            <View style={[s.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.xpRow}>
                <View style={s.xpLeft}>
                  <LinearGradient colors={gradients.xp} style={s.xpIconBg}>
                    <Ionicons name="flash" size={13} color="#000" />
                  </LinearGradient>
                  <View>
                    <Text style={[s.xpValue, { color: colors.text }]}>{data?.xp ?? 0} XP</Text>
                    <Text style={[s.xpSub, { color: colors.textMuted }]}>Total earned</Text>
                  </View>
                </View>
                <View style={[s.xpNextBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.xpNextTxt, { color: colors.textSub }]}>
                    {100 - xpInLevel} XP → Lv {level + 1}
                  </Text>
                </View>
              </View>

              <View style={[s.xpTrack, { backgroundColor: colors.surface }]}>
                <Animated.View style={[s.xpFill, {
                  width: xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }]}>
                  <LinearGradient colors={gradients.xp} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <View style={s.xpShine} />
                </Animated.View>
              </View>

              <View style={s.xpFooter}>
                <Text style={[s.xpPct, { color: colors.textMuted }]}>{Math.round(xpProgress * 100)}% to next level</Text>
                <View style={s.xpDots}>
                  {[25, 50, 75].map((mark) => (
                    <View key={mark} style={[s.xpMark, {
                      backgroundColor: xpProgress * 100 >= mark ? colors.yellow : colors.border,
                    }]} />
                  ))}
                </View>
              </View>
            </View>

            {/* ── Stats Row ── */}
            <View style={s.statsRow}>
              {[
                { icon: 'flame',          color: colors.primary, value: streak,        label: 'Streak' },
                { icon: 'flash',          color: colors.yellow,  value: data?.xp ?? 0, label: 'XP'     },
                { icon: 'checkmark-done', color: colors.green,   value: completedToday, label: 'Done'  },
              ].map((item, i) => (
                <View key={i} style={[s.statCard, { backgroundColor: colors.card, borderColor: item.color + '25' }]}>
                  <LinearGradient colors={[item.color + '20', item.color + '08']} style={s.statGrad} />
                  <View style={[s.statIconWrap, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={[s.statLbl, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* ── AI Insight ── */}
            {insights.length > 0 && (() => {
              const insight = insights[0];
              const meta    = INSIGHT_META[insight.type] ?? INSIGHT_META.suggestion;
              const accent  = (colors as any)[meta.colorKey];
              return (
                <View style={[s.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <LinearGradient
                    colors={[accent + '18', accent + '05']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[s.insightAccent, { backgroundColor: accent }]} />
                  <View style={[s.insightIconWrap, { backgroundColor: accent + '20' }]}>
                    <Ionicons name={meta.icon as any} size={18} color={accent} />
                  </View>
                  <View style={s.insightBody}>
                    <Text style={[s.insightLabel, { color: accent }]}>{meta.label}</Text>
                    <Text style={[s.insightTxt, { color: colors.textSub }]} numberOfLines={2}>
                      {insight.message}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              );
            })()}

            {/* ── Tasks Header ── */}
            <View style={s.sectionRow}>
              <View style={s.sectionLeft}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Today's Tasks</Text>
                <View style={[s.taskCountPill, { backgroundColor: taskCount > 0 ? colors.primary + '18' : colors.surface, borderColor: taskCount > 0 ? colors.primaryBorder : colors.border }]}>
                  <Text style={[s.taskCountTxt, { color: taskCount > 0 ? colors.primary : colors.textMuted }]}>
                    {taskCount} remaining
                  </Text>
                </View>
              </View>
              <Animated.View style={addPress.style}>
                <TouchableOpacity
                  style={[s.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => nav.navigate('CreateTask')}
                  onPressIn={addPress.onPressIn}
                  onPressOut={addPress.onPressOut}
                  activeOpacity={1}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={s.addTxt}>New Task</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

          </Animated.View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleComplete}
            onFocus={handleFocusMode}
            completing={isPending && variables?.taskId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <LinearGradient
              colors={[colors.primary + '18', colors.primary + '08']}
              style={[s.emptyIconWrap, { borderColor: colors.primaryBorder }]}
            >
              <Ionicons name="add-circle-outline" size={44} color={colors.primary} />
            </LinearGradient>
            <Text style={[s.emptyTitle, { color: colors.text }]}>All clear</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>
              Add your first task and start building an unbreakable streak.
            </Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => nav.navigate('CreateTask')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.emptyBtnTxt}>Create First Task</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120 },

  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: { fontSize: font.sm, fontWeight: '500', marginBottom: 2 },
  name:     { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.8 },
  notifBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  heroBanner: {
    borderRadius: radius.xxl, padding: spacing.lg,
    marginBottom: spacing.md, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  glowOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -40 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroLeft:    { alignItems: 'center' },
  heroCenter:  { flex: 1, alignItems: 'center' },
  heroRight:   { alignItems: 'flex-end', gap: 6 },

  heroStreakNum:   { fontSize: 64, fontWeight: '900', lineHeight: 68, letterSpacing: -3 },
  heroStreakLabel: { fontSize: font.xs, fontWeight: '800', letterSpacing: 2, marginTop: -4 },
  heroMotivation: { fontSize: font.sm, fontWeight: '600', marginTop: 6, textAlign: 'center' },

  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  levelBadgeTxt: { fontSize: font.xs, fontWeight: '800', color: '#fff' },

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1,
  },
  heroBadgeTxt: { fontSize: 10, fontWeight: '700' },

  xpCard:     { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, gap: 10 },
  xpRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpIconBg:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  xpValue:    { fontSize: font.lg, fontWeight: '800', letterSpacing: -0.3 },
  xpSub:      { fontSize: font.xs, fontWeight: '500', marginTop: 1 },
  xpNextBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  xpNextTxt:  { fontSize: font.xs, fontWeight: '600' },
  xpTrack:    { height: 12, borderRadius: radius.full, overflow: 'hidden' },
  xpFill:     { height: '100%', borderRadius: radius.full, overflow: 'hidden' },
  xpShine:    { position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: radius.full },
  xpFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpPct:      { fontSize: font.xs, fontWeight: '500' },
  xpDots:     { flexDirection: 'row', gap: 4 },
  xpMark:     { width: 6, height: 6, borderRadius: 3 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1, borderRadius: radius.xl, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, gap: 4, overflow: 'hidden',
  },
  statGrad:    { ...StyleSheet.absoluteFillObject },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal:     { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5 },
  statLbl:     { fontSize: font.xs, fontWeight: '600', letterSpacing: 0.3 },

  insightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.md, borderRadius: radius.xl, borderWidth: 1,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  insightAccent:   { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  insightIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightBody:     { flex: 1 },
  insightLabel:    { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.6, marginBottom: 3 },
  insightTxt:      { fontSize: font.sm, lineHeight: 18 },

  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:  { fontSize: font.lg, fontWeight: '900', letterSpacing: -0.3 },
  taskCountPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  taskCountTxt:  { fontSize: font.xs, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full,
  },
  addTxt: { fontSize: font.sm, fontWeight: '700', color: '#fff' },

  empty:        { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyTitle:   { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5 },
  emptySub:     { fontSize: font.sm, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  emptyBtnTxt: { fontSize: font.sm, fontWeight: '700', color: '#fff' },
});
