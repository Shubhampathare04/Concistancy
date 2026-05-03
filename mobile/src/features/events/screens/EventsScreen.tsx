import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { eventsApi } from '@/features/tasks/api';
import { font, spacing, radius, gradients } from '@/constants/theme';

function timeLeft(end: string): string {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

export default function EventsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardEvent, setLeaderboardEvent] = useState<number | null>(null);

  const { data: events = [], refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await eventsApi.list()).data,
    staleTime: 1000 * 60 * 2,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['event-leaderboard', leaderboardEvent],
    queryFn: async () => leaderboardEvent ? (await eventsApi.leaderboard(leaderboardEvent)).data : [],
    enabled: leaderboardEvent != null,
  });

  const { mutate: joinEvent } = useMutation({
    mutationFn: (id: number) => eventsApi.join(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const { mutate: completeEvent } = useMutation({
    mutationFn: (id: number) => eventsApi.complete(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={[s.pageTitle, { color: colors.text }]}>Events & Challenges</Text>

        {events.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="trophy-outline" size={44} color={colors.textDim} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No active events</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>Check back soon for new challenges</Text>
          </View>
        ) : (
          events.map((event: any) => {
            const isChallenge = event.type === 'challenge';
            const accent = isChallenge ? colors.primary : colors.purple;
            return (
              <View key={event.id} style={[s.eventCard, { backgroundColor: colors.card, borderColor: accent + '30' }]}>
                <LinearGradient colors={[accent + '10', accent + '04']} style={StyleSheet.absoluteFill} />
                <View style={s.eventHeader}>
                  <View style={[s.eventTypePill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                    <Ionicons name={isChallenge ? 'flash' : 'calendar'} size={11} color={accent} />
                    <Text style={[s.eventTypeTxt, { color: accent }]}>{event.type}</Text>
                  </View>
                  <Text style={[s.timeLeft, { color: colors.textMuted }]}>{timeLeft(event.end_date)}</Text>
                </View>

                <Text style={[s.eventTitle, { color: colors.text }]}>{event.title}</Text>
                {event.description ? (
                  <Text style={[s.eventDesc, { color: colors.textSub }]} numberOfLines={2}>{event.description}</Text>
                ) : null}

                <View style={s.eventFooter}>
                  <View style={s.eventMeta}>
                    <View style={[s.metaBadge, { backgroundColor: colors.yellow + '14' }]}>
                      <Ionicons name="diamond" size={11} color={colors.yellow} />
                      <Text style={[s.metaTxt, { color: colors.yellow }]}>+{event.reward_coins} coins</Text>
                    </View>
                    <View style={[s.metaBadge, { backgroundColor: colors.surface }]}>
                      <Ionicons name="people-outline" size={11} color={colors.textMuted} />
                      <Text style={[s.metaTxt, { color: colors.textMuted }]}>{event.participant_count}</Text>
                    </View>
                  </View>
                  <View style={s.eventActions}>
                    <TouchableOpacity
                      style={[s.lbBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setLeaderboardEvent(event.id)}
                    >
                      <Ionicons name="podium-outline" size={14} color={colors.textSub} />
                    </TouchableOpacity>
                    {!event.user_joined ? (
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: accent }]}
                        onPress={() => joinEvent(event.id)}
                      >
                        <Text style={s.actionBtnTxt}>Join</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: colors.green }]}
                        onPress={() => completeEvent(event.id)}
                      >
                        <Ionicons name="checkmark" size={14} color="#fff" />
                        <Text style={s.actionBtnTxt}>Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Leaderboard Modal */}
      <Modal visible={leaderboardEvent != null} transparent animationType="slide" onRequestClose={() => setLeaderboardEvent(null)}>
        <View style={s.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setLeaderboardEvent(null)} />
          <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.text }]}>Leaderboard</Text>
            <ScrollView>
              {leaderboard.length === 0 ? (
                <Text style={[s.lbEmpty, { color: colors.textMuted }]}>No completions yet</Text>
              ) : (
                leaderboard.map((entry: any) => (
                  <View key={entry.user_id} style={[s.lbRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.lbRank, { color: entry.rank <= 3 ? colors.yellow : colors.textMuted }]}>
                      #{entry.rank}
                    </Text>
                    <Text style={[s.lbName, { color: colors.text }]}>{entry.name}</Text>
                    <View style={s.lbStats}>
                      <Text style={[s.lbXp, { color: colors.yellow }]}>{entry.xp} XP</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={[s.lbStreak, { color: colors.primary }]}>{entry.streak}</Text>
                        <Ionicons name="flame" size={12} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.lg },

  empty:      { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: font.xl, fontWeight: '800' },
  emptySub:   { fontSize: font.sm, textAlign: 'center' },

  eventCard:   { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden', gap: 8 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventTypePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  eventTypeTxt:  { fontSize: font.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeLeft:    { fontSize: font.xs, fontWeight: '600' },
  eventTitle:  { fontSize: font.lg, fontWeight: '800', letterSpacing: -0.3 },
  eventDesc:   { fontSize: font.sm, lineHeight: 18 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  eventMeta:   { flexDirection: 'row', gap: 8 },
  metaBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  metaTxt:     { fontSize: font.xs, fontWeight: '700' },
  eventActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lbBtn:       { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  actionBtnTxt: { color: '#fff', fontWeight: '800', fontSize: font.sm },

  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalSheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, maxHeight: '70%' },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle:    { fontSize: font.xl, fontWeight: '800', marginBottom: spacing.md },
  lbEmpty:       { textAlign: 'center', padding: spacing.xl, fontSize: font.sm },
  lbRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  lbRank:        { fontSize: font.md, fontWeight: '900', width: 32 },
  lbName:        { flex: 1, fontSize: font.md, fontWeight: '600' },
  lbStats:       { flexDirection: 'row', gap: 12 },
  lbXp:          { fontSize: font.sm, fontWeight: '700' },
  lbStreak:      { fontSize: font.sm, fontWeight: '700' },
});
