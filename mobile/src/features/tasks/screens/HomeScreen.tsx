import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDashboard, useCompleteTask } from '../hooks/useTasks';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import TaskCard from '@/components/TaskCard';
import StatCard from '@/components/StatCard';
import { font, spacing, radius } from '@/constants/theme';
import { Task } from '../types';

export default function HomeScreen() {
  const { data, isLoading, refetch } = useDashboard();
  const { mutate: complete, isPending, variables } = useCompleteTask();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const xpInLevel = (data?.xp ?? 0) % 100;
  const xpProgress = xpInLevel / 100;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const streakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak < 7) return 'Keep it going!';
    if (streak < 30) return "You're on fire!";
    return 'Legendary consistency!';
  };

  return (
    <ScreenWrapper padded={false}>
      <FlatList
        data={data?.tasks ?? []}
        keyExtractor={(item: Task) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Top Bar */}
            <View style={s.topBar}>
              <View>
                <Text style={[s.greeting, { color: colors.textMuted }]}>{greeting()},</Text>
                <Text style={[s.name, { color: colors.text }]}>{user?.name ?? 'Champion'}</Text>
              </View>
              <View style={[s.levelPill, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={[s.levelTxt, { color: colors.primary }]}>Lv {data?.level ?? 1}</Text>
              </View>
            </View>

            {/* Streak Card */}
            <View style={[s.streakCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}>
              <View style={[s.streakIconWrap, { backgroundColor: colors.primaryDim }]}>
                <Ionicons name="flame" size={28} color={colors.primary} />
              </View>
              <View style={s.streakMid}>
                <Text style={[s.streakNum, { color: colors.primary }]}>{data?.streak ?? 0}</Text>
                <Text style={[s.streakLabel, { color: colors.textMuted }]}>Day Streak</Text>
              </View>
              <View style={s.streakRight}>
                <Text style={[s.streakMsg, { color: colors.text }]}>{streakMessage(data?.streak ?? 0)}</Text>
              </View>
            </View>

            {/* XP Bar */}
            <View style={s.xpSection}>
              <View style={s.xpRow}>
                <View style={s.xpLeft}>
                  <Ionicons name="flash" size={14} color={colors.yellow} />
                  <Text style={[s.xpTxt, { color: colors.yellow }]}>{data?.xp ?? 0} XP</Text>
                </View>
                <Text style={[s.xpNext, { color: colors.textDim }]}>{100 - xpInLevel} to next level</Text>
              </View>
              <View style={[s.xpTrack, { backgroundColor: colors.surface }]}>
                <View style={[s.xpFill, { width: `${xpProgress * 100}%`, backgroundColor: colors.yellow }]} />
              </View>
            </View>

            {/* Stats Row */}
            <View style={s.statsRow}>
              <StatCard
                icon={<Ionicons name="flame" size={18} color={colors.primary} />}
                label="Streak" value={data?.streak ?? 0} color={colors.primary}
              />
              <StatCard
                icon={<Ionicons name="flash" size={18} color={colors.yellow} />}
                label="XP" value={data?.xp ?? 0} color={colors.yellow}
              />
              <StatCard
                icon={<Ionicons name="checkmark-circle" size={18} color={colors.green} />}
                label="Tasks" value={data?.tasks?.length ?? 0} color={colors.green}
              />
            </View>

            {/* AI Insight */}
            {(data?.suggestions?.length ?? 0) > 0 && (
              <View style={[s.insightBox, { backgroundColor: colors.blueDim, borderColor: colors.blue + '30' }]}>
                <View style={s.insightHeader}>
                  <Ionicons name="bulb-outline" size={16} color={colors.blue} />
                  <Text style={[s.insightTitle, { color: colors.blue }]}>AI Insight</Text>
                </View>
                {data?.suggestions.map((sg, i) => (
                  <Text key={i} style={[s.insightTxt, { color: colors.textSub }]}>• {sg}</Text>
                ))}
              </View>
            )}

            {/* Section Header */}
            <View style={s.sectionRow}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                Today's Tasks
                <Text style={[s.taskCount, { color: colors.textMuted }]}> ({data?.tasks?.length ?? 0})</Text>
              </Text>
              <TouchableOpacity
                style={[s.addBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}
                onPress={() => navigation.navigate('CreateTask')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[s.addTxt, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={(id) => complete(id)}
            completing={isPending && variables === item.id}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons name="clipboard-outline" size={40} color={colors.textDim} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No tasks yet</Text>
              <Text style={[s.emptySub, { color: colors.textMuted }]}>Add your first task to start building consistency</Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}
                onPress={() => navigation.navigate('CreateTask')}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[s.emptyBtnTxt, { color: colors.primary }]}>Create First Task</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  list: { padding: 20, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: font.sm },
  name: { fontSize: font.xl, fontWeight: '800' },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  levelTxt: { fontWeight: '700', fontSize: font.sm },
  streakCard: { borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  streakIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  streakMid: { alignItems: 'center' },
  streakNum: { fontSize: 40, fontWeight: '900', lineHeight: 44 },
  streakLabel: { fontSize: font.xs, fontWeight: '600' },
  streakRight: { flex: 1 },
  streakMsg: { fontSize: font.sm, fontWeight: '600', textAlign: 'right' },
  xpSection: { marginBottom: spacing.lg },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  xpLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpTxt: { fontSize: font.sm, fontWeight: '700' },
  xpNext: { fontSize: font.xs },
  xpTrack: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: radius.full },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  insightBox: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  insightTitle: { fontSize: font.sm, fontWeight: '700' },
  insightTxt: { fontSize: font.sm, marginTop: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: font.lg, fontWeight: '700' },
  taskCount: { fontWeight: '400' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  addTxt: { fontSize: font.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: font.lg, fontWeight: '700' },
  emptySub: { fontSize: font.sm, textAlign: 'center', maxWidth: 240 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, marginTop: spacing.sm },
  emptyBtnTxt: { fontSize: font.sm, fontWeight: '700' },
});
