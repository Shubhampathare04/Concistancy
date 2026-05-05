import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard, useCompleteTask } from '@/features/tasks/hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionUIStore } from '@/store/useSessionUIStore';
import { useTheme } from '@/store/ThemeContext';
import { spacing } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { TaskCard } from '@/components/TaskCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { CircularProgressRing } from '@/components/progress/CircularProgressRing';
import { XPProgressBar } from '@/components/progress/XPProgressBar';
import { haptics } from '@/hooks/useHaptics';
import type { Task } from '@/features/tasks/types';
import { XPBurst } from '@/components/feedback/XPBurst';
import { TodaySkeleton } from '@/components/SkeletonLoader';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Task>);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning ritual';
  if (h < 17) return 'Afternoon checkpoint';
  return 'Evening closeout';
}

const TIERS = ['Quick wins', 'Steady', 'Hard', 'Boss'] as const;

function tierName(difficulty: number) {
  if (difficulty <= 2) return TIERS[0];
  if (difficulty === 3) return TIERS[1];
  if (difficulty === 4) return TIERS[2];
  return TIERS[3];
}

export function TodayScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch } = useDashboard();
  const { mutate: complete, isPending, variables } = useCompleteTask();
  const skipTaskForToday = useSessionUIStore((s) => s.skipTaskForToday);
  const isSkippedToday = useSessionUIStore((s) => s.isSkippedToday);

  const [refreshing, setRefreshing] = useState(false);
  const [burst, setBurst] = useState<{ xp: number; token: number } | null>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const streak = data?.streak ?? 0;
  const level = data?.level ?? 1;
  const xpInLevel = (data?.xp ?? 0) % 100;
  const xpToNext = 100;

  const rawTasks = data?.tasks ?? [];
  const tasks = useMemo(() => rawTasks.filter((t) => !isSkippedToday(t.id)), [rawTasks, isSkippedToday]);

  const completedToday = data?.total_completions ?? 0;
  const denom = Math.max(1, completedToday + tasks.length);
  const dayProgress = tasks.length === 0 && rawTasks.length === 0 ? (completedToday > 0 ? 1 : 0) : Math.min(1, completedToday / denom);

  const sections = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const k = tierName(t.difficulty);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [tasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  };

  const handleComplete = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    const xp = (task?.difficulty ?? 1) * 10;
    complete(
      { taskId },
      {
        onSuccess: (res) => {
          setBurst({ xp: res?.xp_gained > 0 ? res.xp_gained : xp, token: Date.now() });
        },
      }
    );
  };

  const handleSkip = (taskId: number) => {
    skipTaskForToday(taskId);
  };

  if (isLoading && !data) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <TodaySkeleton />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      {burst ? <XPBurst xp={burst.xp} token={burst.token} onDone={() => setBurst(null)} /> : null}
      <AnimatedSectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ paddingTop: spacing[6], gap: spacing[4] }}>
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <CText variant="sectionLabel" tone="muted">{greeting()}</CText>
                <CText variant="heroTitle">{user?.name ? `Hey, ${user.name}` : 'Coach mode on'}</CText>
                <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
                  Show up once. The streak does the rest.
                </CText>
              </View>
              <Surface layer="bg1" rounded="pill" border style={s.searchBtn}>
                <Ionicons name="search" size={18} color={colors.textSub} />
              </Surface>
            </View>

            <Surface layer="bg1" rounded="xl" border style={s.hero}>
              <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={s.heroTop}>
                <View style={{ gap: spacing[1] }}>
                  <CText variant="sectionLabel" tone="primary">Streak</CText>
                  <CText variant="heroNumber">{streak}</CText>
                  <CText variant="caption" tone="sub">{completedToday} wins today</CText>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgressRing size={110} strokeWidth={10} progress={dayProgress} />
                  <View style={s.ringCenter}>
                    <CText variant="micro" tone="muted">Today</CText>
                    <CText variant="title">{Math.round(dayProgress * 100)}%</CText>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: spacing[4] }}>
                <XPProgressBar level={level} xpInLevel={xpInLevel} xpToNext={xpToNext} />
              </View>
            </Surface>

            <View style={{ gap: spacing[1] }}>
              <CText variant="sectionLabel" tone="muted">Today’s missions</CText>
              <CText variant="caption" tone="sub">Swipe right to claim XP. Swipe left for “later”.</CText>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
            <CText variant="sectionLabel" tone="muted">{section.title}</CText>
          </View>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            disabled={isPending && variables?.taskId === item.id}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        )}
        ListEmptyComponent={
          <Surface layer="bg1" rounded="xl" border style={[s.empty, { marginTop: spacing[6] }]}>
            <LinearGradient colors={['rgba(124,92,255,0.18)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Ionicons name="sparkles" size={22} color={colors.primary2} />
            <CText variant="title">All clear.</CText>
            <CText variant="caption" tone="sub" style={{ textAlign: 'center' }}>
              Add one tiny mission — momentum loves a first rep.
            </CText>
          </Surface>
        }
      />

      <FloatingActionButton onPress={() => nav.navigate('Create')} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[20] },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  searchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { padding: spacing[5], overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4] },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing[6], alignItems: 'center', gap: spacing[2], overflow: 'hidden' },
});

