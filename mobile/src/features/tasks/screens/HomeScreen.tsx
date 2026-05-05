import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useDashboard, useCompleteTask } from '../hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionUIStore } from '@/store/useSessionUIStore';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import TaskCard from '@/components/TaskCard';
import XPGainToast from '@/components/XPGainToast';
import RewardModal from '@/components/RewardModal';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import { HomeHeaderSkeleton, TaskCardSkeleton } from '@/components/SkeletonLoader';
import StreakWidget from '@/components/StreakWidget';
import XPBar from '@/components/XPBar';
import InsightCard from '@/components/InsightCard';
import { spacing, radius, type, shadow } from '@/constants/theme';
import { Task, AIInsight, CompleteTaskResult } from '../types';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Task>);

interface RewardState {
  visible: boolean;
  xpGained: number;
  newStreak: number;
  levelUp: boolean;
  newLevel: number;
  coinsGained: number;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function streakCoachCopy(streak: number) {
  if (streak === 0) return 'Your coach is ready — one win today starts the fire.';
  if (streak < 3) return 'Early streak energy. Protect it like a treasure.';
  if (streak < 7) return 'Momentum is building. Stay boring, stay consistent.';
  if (streak < 14) return 'You are officially hard to ignore. Keep stacking days.';
  if (streak < 30) return 'Elite rhythm. The app should feel easier now — that is the point.';
  return 'Legend mode. Show up anyway — pride is the new grind.';
}

const DIFF_GROUPS = ['Quick win', 'Light', 'Steady', 'Heavy', 'Beast mode'];

export default function HomeScreen() {
  const { data, isLoading, refetch } = useDashboard();
  const { mutate: complete, isPending, variables } = useCompleteTask();
  const user = useAuthStore((s) => s.user);
  const skipTaskForToday = useSessionUIStore((s) => s.skipTaskForToday);
  const isSkippedToday = useSessionUIStore((s) => s.isSkippedToday);
  const nav = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [xpToast, setXpToast] = useState<{ xp: number; key: number } | null>(null);
  const [reward, setReward] = useState<RewardState>({
    visible: false,
    xpGained: 0,
    newStreak: 0,
    levelUp: false,
    newLevel: 1,
    coinsGained: 0,
  });

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 120], [0, 10], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(scrollY.value, [0, 200], [1, 0.92], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 240], [1, 0.85], Extrapolation.CLAMP),
  }));

  const streak = data?.streak ?? 0;
  const level = data?.level ?? 1;
  const rawTasks = data?.tasks ?? [];
  const tasks = useMemo(
    () => rawTasks.filter((t) => !isSkippedToday(t.id)),
    [rawTasks, isSkippedToday]
  );

  const completedToday = data?.total_completions ?? 0;
  const taskCount = tasks.length;
  const denom = Math.max(1, completedToday + taskCount);
  const dayProgress = taskCount === 0 && rawTasks.length === 0 ? (completedToday > 0 ? 1 : 0) : Math.min(1, completedToday / denom);

  const xpInLevel = (data?.xp ?? 0) % 100;
  const xpToNext = 100;

  const insights: AIInsight[] = data?.insights?.length
    ? data.insights
    : (data?.suggestions ?? []).map((s, i) => ({
        type: 'suggestion' as const,
        message: s,
        priority: i + 1,
      }));

  const sections = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const idx = Math.min(Math.max(t.difficulty - 1, 0), DIFF_GROUPS.length - 1);
      const tier = DIFF_GROUPS[idx];
      if (!map.has(tier)) map.set(tier, []);
      map.get(tier)!.push(t);
    }
    return DIFF_GROUPS.filter((k) => map.has(k)).map((k) => ({ title: k, data: map.get(k)! }));
  }, [tasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await refetch();
    setRefreshing(false);
  };

  const handleComplete = useCallback(
    (taskId: number) => {
      const task = tasks.find((t) => t.id === taskId) ?? rawTasks.find((t) => t.id === taskId);
      const estimatedXp = task ? task.difficulty * 10 : 10;
      complete(
        { taskId },
        {
          onSuccess: (result: CompleteTaskResult) => {
            const xp = result.status === 'queued' ? estimatedXp : result.xp_gained;
            if (xp > 0) setXpToast({ xp, key: Date.now() });
            setTimeout(() => {
              setReward({
                visible: true,
                xpGained: xp,
                newStreak: result.new_streak || streak + 1,
                levelUp: result.level_up ?? false,
                newLevel: result.new_level ?? level,
                coinsGained: task?.difficulty ?? 1,
              });
            }, 320);
          },
        }
      );
    },
    [complete, tasks, rawTasks, streak, level]
  );

  const handleSkip = useCallback(
    (taskId: number) => {
      skipTaskForToday(taskId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    [skipTaskForToday]
  );

  const handleFocusMode = useCallback(
    (task: Task) => {
      nav.navigate('FocusMode', { task });
    },
    [nav]
  );

  if (isLoading) {
    return (
      <ScreenWrapper padded={false}>
        <HomeHeaderSkeleton />
        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
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

      <AnimatedSectionList
        sections={taskCount === 0 ? [] : sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <View style={s.topBar}>
              <View>
                <Text style={[s.greet, { color: colors.textMuted }, type.micro]}>{greeting()}</Text>
                <Text style={[s.name, { color: colors.text }]}>{user?.name ?? 'Champion'}</Text>
                <Text style={[s.tagline, { color: colors.textSub }, type.caption]}>
                  Coach mode on — small reps, big identity.
                </Text>
              </View>
              <View style={s.topRight}>
                <SyncStatusBadge compact />
                <TouchableOpacity
                  style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, shadow.sm]}
                  onPress={() => nav.navigate('Search')}
                >
                  <Ionicons name="search-outline" size={18} color={colors.textSub} />
                </TouchableOpacity>
              </View>
            </View>

            <StreakWidget
              streak={streak}
              subtitle={streakCoachCopy(streak)}
              dayProgress={dayProgress}
              level={level}
            />

            <XPBar
              totalXp={data?.xp ?? 0}
              level={level}
              xpInLevel={xpInLevel}
              xpToNext={xpToNext}
            />

            {insights[0] ? (
              <InsightCard insight={insights[0]} onPress={() => nav.navigate('Insights')} />
            ) : null}

            <View style={s.sectionHead}>
              <View>
                <Text style={[s.missionTitle, { color: colors.text }, type.section]}>Today’s missions</Text>
                <Text style={[s.missionSub, { color: colors.textMuted }, type.caption]}>
                  {taskCount} active · swipe right done · swipe left “later”
                </Text>
              </View>
              <View style={[s.pill, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
                <Text style={[s.pillTxt, { color: colors.primary }]}>{completedToday} wins logged</Text>
              </View>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[s.groupBar, { backgroundColor: colors.bg }]}>
            <LinearGradient
              colors={[colors.primary + '18', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[s.groupTitle, { color: colors.text }]}>{title}</Text>
            <View style={[s.groupDot, { backgroundColor: colors.primary }]} />
          </View>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onFocus={handleFocusMode}
            completing={isPending && variables?.taskId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <LinearGradient
              colors={[colors.secondary + '22', colors.primary + '15']}
              style={[s.emptyGlow, { borderColor: colors.primaryBorder }]}
            >
              <Ionicons name="rocket-outline" size={40} color={colors.primary} />
            </LinearGradient>
            <Text style={[s.emptyTitle, { color: colors.text }, type.title]}>All missions clear</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }, type.body]}>
              {rawTasks.length === 0
                ? 'Add a mission — your streak and XP are waiting.'
                : 'Everything today is paused or done. Nice.'}
            </Text>
            <TouchableOpacity
              style={[s.cta, { backgroundColor: colors.primary }, shadow.md]}
              onPress={() => nav.navigate('CreateTask')}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={s.ctaTxt}>New mission</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Animated.View style={[s.fab, fabStyle]} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            nav.navigate('CreateTask');
          }}
        >
          <LinearGradient colors={['#ff6b35', '#c084fc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.fabInner}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  list: { paddingHorizontal: spacing.md, paddingBottom: 140 },
  headerBlock: { paddingTop: Platform.OS === 'ios' ? 8 : 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  greet: { textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  name: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  tagline: { marginTop: 6, maxWidth: 260 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 12,
  },
  missionTitle: { marginBottom: 4 },
  missionSub: { maxWidth: 220 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillTxt: { fontSize: 11, fontWeight: '800' },
  groupBar: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: spacing.sm,
    marginBottom: 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  groupDot: { width: 6, height: 6, borderRadius: 3 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.md },
  emptyGlow: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyTitle: { textAlign: 'center' },
  emptySub: { textAlign: 'center', maxWidth: 280 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: Platform.OS === 'ios' ? 102 : 88,
    ...shadow.lg,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
