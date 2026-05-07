import { useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDashboard, useCompleteTask } from '@/features/tasks/hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import { useSessionUIStore } from '@/store/useSessionUIStore';
import { useTheme } from '@/store/ThemeContext';
import { spacing } from '@/constants/theme';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { TaskCard } from '@/components/TaskCard';
import { StaticProgressRing } from '@/components/StaticProgressRing';
import { StaticXPBar } from '@/components/StaticXPBar';
import { SimpleToast } from '@/components/SimpleToast';
import type { Task } from '@/features/tasks/types';

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
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch } = useDashboard();
  const { mutate: complete, isPending, variables } = useCompleteTask();
  const skipTaskForToday = useSessionUIStore((s) => s.skipTaskForToday);
  const isSkippedToday = useSessionUIStore((s) => s.isSkippedToday);

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
          setToast({ message: `+${res?.xp_gained || xp} XP earned!`, type: 'success' });
        },
        onError: () => {
          setToast({ message: 'Failed to complete task', type: 'error' });
        },
      }
    );
  };

  const handleSkip = (taskId: number) => {
    skipTaskForToday(taskId);
    setToast({ message: 'Task skipped for today', type: 'info' });
  };

  if (isLoading && !data) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <Text style={{ color: colors.text, fontSize: 16 }}>Loading your missions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      {toast && <SimpleToast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ paddingTop: spacing[6], gap: spacing[4] }}>
            {/* Header */}
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <CText variant="sectionLabel" tone="muted">{greeting()}</CText>
                <CText variant="heroTitle">{user?.name ? `Hey, ${user.name}` : 'Coach mode on'}</CText>
                <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
                  Show up once. The streak does the rest.
                </CText>
              </View>
              <TouchableOpacity
                style={[s.searchBtn, { backgroundColor: colors.bg1, borderColor: colors.strokeSubtle }]}
                onPress={() => nav.navigate('Search')}
              >
                <Ionicons name="search" size={18} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            {/* Stats Card */}
            <Surface layer="bg1" rounded="xl" border style={s.hero}>
              <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={s.heroTop}>
                <View style={{ gap: spacing[1] }}>
                  <CText variant="sectionLabel" tone="primary">Streak</CText>
                  <CText variant="heroNumber">{streak}</CText>
                  <CText variant="caption" tone="sub">{completedToday} wins today</CText>
                </View>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <StaticProgressRing size={110} strokeWidth={10} progress={dayProgress} />
                  <View style={s.ringCenter}>
                    <CText variant="micro" tone="muted">Today</CText>
                    <CText variant="title">{Math.round(dayProgress * 100)}%</CText>
                  </View>
                </View>
              </View>
              <View style={{ marginTop: spacing[4] }}>
                <StaticXPBar level={level} xpInLevel={xpInLevel} xpToNext={xpToNext} />
              </View>
            </Surface>

            {/* Quick Actions */}
            <View style={s.quickActions}>
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.bg1, borderColor: colors.strokeSubtle }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  nav.navigate('Progress');
                }}
              >
                <Ionicons name="bar-chart" size={20} color={colors.primary} />
                <CText variant="caption" tone="primary">Stats</CText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.bg1, borderColor: colors.strokeSubtle }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  nav.navigate('Social');
                }}
              >
                <Ionicons name="people" size={20} color={colors.primary} />
                <CText variant="caption" tone="primary">Friends</CText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.bg1, borderColor: colors.strokeSubtle }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  nav.navigate('Profile');
                }}
              >
                <Ionicons name="person" size={20} color={colors.primary} />
                <CText variant="caption" tone="primary">Profile</CText>
              </TouchableOpacity>
            </View>

            {/* AI Insights */}
            {data?.insights && data.insights.length > 0 && (
              <Surface layer="bg1" rounded="xl" border style={s.insightCard}>
                <View style={s.insightHeader}>
                  <Ionicons name="bulb" size={20} color={colors.yellow} />
                  <CText variant="sectionLabel" tone="muted">AI Insight</CText>
                </View>
                <CText variant="body" style={{ marginTop: spacing[2] }}>
                  {data.insights[0].message}
                </CText>
                {data.insights[0].action_label && (
                  <TouchableOpacity
                    style={[s.insightAction, { backgroundColor: colors.primaryWash }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }}
                  >
                    <CText variant="caption" tone="primary">{data.insights[0].action_label}</CText>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </Surface>
            )}

            {/* Section Header */}
            <View style={{ gap: spacing[1] }}>
              <CText variant="sectionLabel" tone="muted">Today's missions</CText>
              <CText variant="caption" tone="sub">Tap buttons to complete or skip tasks.</CText>
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
            <Ionicons name="sparkles" size={32} color={colors.primary2} />
            <CText variant="title">All clear.</CText>
            <CText variant="caption" tone="sub" style={{ textAlign: 'center' }}>
              Add one tiny mission — momentum loves a first rep.
            </CText>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => nav.navigate('Create')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={s.emptyBtnText}>Create Task</Text>
            </TouchableOpacity>
          </Surface>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[20] },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  searchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1 },
  hero: { padding: spacing[5], overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4] },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', gap: spacing[3] },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: 12, borderWidth: 1 },
  insightCard: { padding: spacing[4] },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  insightAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: 8, marginTop: spacing[3], alignSelf: 'flex-start' },
  empty: { padding: spacing[6], alignItems: 'center', gap: spacing[3], overflow: 'hidden' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, marginTop: spacing[2] },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
