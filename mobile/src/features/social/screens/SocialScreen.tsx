import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { socialApi } from '@/features/tasks/api';
import { font, spacing, radius, gradients } from '@/constants/theme';

type Tab = 'leaderboard' | 'feed' | 'search';

const RANK_ICONS = ['medal', 'medal', 'medal'];

export default function SocialScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [tab, setTab]         = useState<Tab>('leaderboard');
  const [by, setBy]           = useState<'xp' | 'streak' | 'coins'>('xp');
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: leaderboard = [], refetch: refetchLb } = useQuery({
    queryKey: ['leaderboard', by],
    queryFn: async () => (await socialApi.leaderboard(by)).data,
    staleTime: 1000 * 60 * 2,
  });

  const { data: feed = [], refetch: refetchFeed } = useQuery({
    queryKey: ['social-feed'],
    queryFn: async () => (await socialApi.feed()).data,
    staleTime: 1000 * 60,
    enabled: tab === 'feed',
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['user-search', searchQ],
    queryFn: async () => searchQ.length >= 2 ? (await socialApi.search(searchQ)).data : [],
    staleTime: 1000 * 30,
    enabled: searchQ.length >= 2,
  });

  const { mutate: follow } = useMutation({
    mutationFn: (id: number) => socialApi.follow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-search'] }),
  });

  const { mutate: unfollow } = useMutation({
    mutationFn: (id: number) => socialApi.unfollow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-search'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'leaderboard') await refetchLb();
    else await refetchFeed();
    setRefreshing(false);
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'leaderboard', label: 'Ranks',  icon: 'podium'       },
    { key: 'feed',        label: 'Feed',   icon: 'pulse'        },
    { key: 'search',      label: 'Search', icon: 'search'       },
  ];

  return (
    <ScreenWrapper>
      <Text style={[s.pageTitle, { color: colors.text }]}>Social</Text>

      {/* Tab Bar */}
      <View style={[s.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && { backgroundColor: colors.primary }]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={15} color={tab === t.key ? '#fff' : colors.textMuted} />
            <Text style={[s.tabTxt, { color: tab === t.key ? '#fff' : colors.textMuted }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Leaderboard ── */}
        {tab === 'leaderboard' && (
          <>
            <View style={s.sortRow}>
              {(['xp', 'streak', 'coins'] as const).map(k => (
                <TouchableOpacity
                  key={k}
                  style={[s.sortBtn, { backgroundColor: by === k ? colors.primary : colors.surface, borderColor: by === k ? colors.primary : colors.border }]}
                  onPress={() => setBy(k)}
                >
                  <Text style={[s.sortTxt, { color: by === k ? '#fff' : colors.textMuted }]}>{k.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {leaderboard.map((entry: any) => (
              <View style={[s.lbRow, { backgroundColor: colors.card, borderColor: entry.rank <= 3 ? colors.yellow + '30' : colors.border }]}>
                {entry.rank <= 3
                  ? <View style={s.medalContainer}><Ionicons name="medal" size={20} color={entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32'} /></View>
                  : <Text style={[s.rankNum, { color: colors.textMuted }]}>#{entry.rank}</Text>
                }
                <View style={[s.lbAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.lbAvatarTxt, { color: colors.primary }]}>{entry.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={s.lbInfo}>
                  <Text style={[s.lbName, { color: colors.text }]}>{entry.name}</Text>
                  <Text style={[s.lbSub, { color: colors.textMuted }]}>Lv {entry.level}</Text>
                </View>
                <View style={s.lbRight}>
                  <Text style={[s.lbVal, { color: colors.yellow }]}>{entry.xp} XP</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={[s.lbStreak, { color: colors.primary }]}>{entry.streak}</Text>
                    <Ionicons name="flame" size={12} color={colors.primary} />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Feed ── */}
        {tab === 'feed' && (
          feed.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={44} color={colors.textDim} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No activity yet</Text>
              <Text style={[s.emptySub, { color: colors.textMuted }]}>Follow people to see their activity here</Text>
            </View>
          ) : (
            feed.map((item: any, i: number) => (
              <View key={i} style={[s.feedItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.feedAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.feedAvatarTxt, { color: colors.primary }]}>{item.user_name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={s.feedBody}>
                  <Text style={[s.feedName, { color: colors.text }]}>{item.user_name}</Text>
                  <Text style={[s.feedAction, { color: colors.textSub }]}>
                    {item.action_type === 'TASK_COMPLETED' ? 'completed a task' : item.action_type.toLowerCase().replace(/_/g, ' ')}
                  </Text>
                  <Text style={[s.feedTime, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {item.meta?.xp_gained > 0 && (
                  <View style={[s.feedXp, { backgroundColor: colors.yellow + '14' }]}>
                    <Ionicons name="flash" size={11} color={colors.yellow} />
                    <Text style={[s.feedXpTxt, { color: colors.yellow }]}>+{item.meta.xp_gained}</Text>
                  </View>
                )}
              </View>
            ))
          )
        )}

        {/* ── Search ── */}
        {tab === 'search' && (
          <>
            <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[s.searchInput, { color: colors.text }]}
                placeholder="Search users..."
                placeholderTextColor={colors.textMuted}
                value={searchQ}
                onChangeText={setSearchQ}
                autoCapitalize="none"
              />
            </View>
            {searchResults.map((u: any) => (
              <View key={u.id} style={[s.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.lbAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.lbAvatarTxt, { color: colors.primary }]}>{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={s.lbInfo}>
                  <Text style={[s.lbName, { color: colors.text }]}>{u.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[s.lbSub, { color: colors.textMuted }]}>Lv {u.level} • {u.streak}</Text>
                    <Ionicons name="flame" size={10} color={colors.primary} />
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.followBtn, { backgroundColor: u.is_following ? colors.surface : colors.primary, borderColor: u.is_following ? colors.border : colors.primary }]}
                  onPress={() => u.is_following ? unfollow(u.id) : follow(u.id)}
                >
                  <Text style={[s.followTxt, { color: u.is_following ? colors.textSub : '#fff' }]}>
                    {u.is_following ? 'Unfollow' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.md },

  tabBar: { flexDirection: 'row', borderRadius: radius.full, borderWidth: 1, padding: 3, marginBottom: spacing.md, gap: 3 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: radius.full },
  tabTxt: { fontSize: font.xs, fontWeight: '700' },

  sortRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  sortTxt: { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.5 },

  lbRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.md, marginBottom: 8, borderWidth: 1, gap: 10 },
  medalContainer: { width: 28, alignItems: 'center', justifyContent: 'center' },
  medal:       { fontSize: 20, width: 28, textAlign: 'center' },
  rankNum:     { fontSize: font.md, fontWeight: '800', width: 28, textAlign: 'center' },
  lbAvatar:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  lbAvatarTxt: { fontSize: font.md, fontWeight: '900' },
  lbInfo:      { flex: 1 },
  lbName:      { fontSize: font.md, fontWeight: '700' },
  lbSub:       { fontSize: font.xs, marginTop: 2 },
  lbRight:     { alignItems: 'flex-end', gap: 2 },
  lbVal:       { fontSize: font.sm, fontWeight: '800' },
  lbStreak:    { fontSize: font.xs, fontWeight: '700' },

  empty:      { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: font.xl, fontWeight: '800' },
  emptySub:   { fontSize: font.sm, textAlign: 'center' },

  feedItem:      { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.md, marginBottom: 8, borderWidth: 1, gap: 10 },
  feedAvatar:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  feedAvatarTxt: { fontSize: font.md, fontWeight: '900' },
  feedBody:      { flex: 1 },
  feedName:      { fontSize: font.sm, fontWeight: '700' },
  feedAction:    { fontSize: font.xs, marginTop: 2 },
  feedTime:      { fontSize: font.xs, marginTop: 2 },
  feedXp:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  feedXpTxt:     { fontSize: font.xs, fontWeight: '700' },

  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md },
  searchInput: { flex: 1, fontSize: font.md },

  userRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.md, marginBottom: 8, borderWidth: 1, gap: 10 },
  followBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  followTxt:  { fontSize: font.xs, fontWeight: '800' },
});
