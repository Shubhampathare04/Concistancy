import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { tasksApi } from '@/features/tasks/api';
import { font, spacing, radius } from '@/constants/theme';

type Tab = 'tasks' | 'habits' | 'events' | 'users';

export default function SearchScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const [q, setQ]     = useState('');
  const [tab, setTab] = useState<Tab>('tasks');

  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => (await tasksApi.search(q)).data,
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  });

  const TABS: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'tasks',  label: 'Tasks',  icon: 'checkmark-circle-outline', count: data?.tasks?.length  ?? 0 },
    { key: 'habits', label: 'Habits', icon: 'leaf-outline',             count: data?.habits?.length ?? 0 },
    { key: 'events', label: 'Events', icon: 'trophy-outline',           count: data?.events?.length ?? 0 },
    { key: 'users',  label: 'People', icon: 'people-outline',           count: data?.users?.length  ?? 0 },
  ];

  return (
    <ScreenWrapper>
      {/* Search bar */}
      <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={[s.input, { color: colors.text }]}
          placeholder="Search tasks, habits, events, people..."
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          autoFocus
          autoCapitalize="none"
        />
        {q.length > 0 && (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {q.length >= 2 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, { backgroundColor: tab === t.key ? colors.primary : colors.surface, borderColor: tab === t.key ? colors.primary : colors.border }]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={13} color={tab === t.key ? '#fff' : colors.textMuted} />
              <Text style={[s.tabTxt, { color: tab === t.key ? '#fff' : colors.textMuted }]}>{t.label}</Text>
              {t.count > 0 && (
                <View style={[s.countBadge, { backgroundColor: tab === t.key ? 'rgba(255,255,255,0.3)' : colors.border }]}>
                  <Text style={[s.countTxt, { color: tab === t.key ? '#fff' : colors.textMuted }]}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {q.length < 2 ? (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={48} color={colors.textDim} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>Search everything</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>Tasks, habits, events, and people — all in one place</Text>
          </View>
        ) : (
          <>
            {/* Tasks */}
            {tab === 'tasks' && (data?.tasks ?? []).map((t: any) => (
              <View key={t.id} style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.resultIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                </View>
                <View style={s.resultBody}>
                  <Text style={[s.resultTitle, { color: colors.text }]}>{t.title}</Text>
                  <Text style={[s.resultSub, { color: colors.textMuted }]}>Difficulty {t.difficulty} • {t.schedule_type}</Text>
                </View>
              </View>
            ))}

            {/* Habits */}
            {tab === 'habits' && (data?.habits ?? []).map((h: any) => (
              <View key={h.id} style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.resultIcon, { backgroundColor: colors.green + '18' }]}>
                  <Ionicons name="leaf-outline" size={18} color={colors.green} />
                </View>
                <View style={s.resultBody}>
                  <Text style={[s.resultTitle, { color: colors.text }]}>{h.title}</Text>
                  <Text style={[s.resultSub, { color: colors.textMuted }]}>{h.category} • {h.frequency}</Text>
                </View>
              </View>
            ))}

            {/* Events */}
            {tab === 'events' && (data?.events ?? []).map((e: any) => (
              <View key={e.id} style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.resultIcon, { backgroundColor: colors.yellow + '18' }]}>
                  <Ionicons name="trophy-outline" size={18} color={colors.yellow} />
                </View>
                <View style={s.resultBody}>
                  <Text style={[s.resultTitle, { color: colors.text }]}>{e.title}</Text>
                  <Text style={[s.resultSub, { color: colors.textMuted }]}>{e.type} • +{e.reward_coins} coins</Text>
                </View>
              </View>
            ))}

            {/* Users */}
            {tab === 'users' && (data?.users ?? []).map((u: any) => (
              <View key={u.id} style={[s.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[s.avatarTxt, { color: colors.primary }]}>{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={s.resultBody}>
                  <Text style={[s.resultTitle, { color: colors.text }]}>{u.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[s.resultSub, { color: colors.textMuted }]}>Lv {u.level} • {u.streak}</Text>
                    <Ionicons name="flame" size={12} color={colors.primary} />
                    <Text style={[s.resultSub, { color: colors.textMuted }]}>streak</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Empty state for tab */}
            {(
              (tab === 'tasks'  && (data?.tasks  ?? []).length === 0) ||
              (tab === 'habits' && (data?.habits ?? []).length === 0) ||
              (tab === 'events' && (data?.events ?? []).length === 0) ||
              (tab === 'users'  && (data?.users  ?? []).length === 0)
            ) && (
              <View style={s.tabEmpty}>
                <Text style={[s.tabEmptyTxt, { color: colors.textMuted }]}>No {tab} found for "{q}"</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 14, marginBottom: spacing.md },
  input:     { flex: 1, fontSize: font.md },

  tabScroll: { marginBottom: spacing.md, maxHeight: 44 },
  tabRow:    { gap: 8, paddingHorizontal: 2 },
  tabBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  tabTxt:    { fontSize: font.xs, fontWeight: '700' },
  countBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.full },
  countTxt:  { fontSize: 9, fontWeight: '800' },

  empty:      { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: font.xl, fontWeight: '800' },
  emptySub:   { fontSize: font.sm, textAlign: 'center', maxWidth: 260 },

  resultRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, marginBottom: 8, gap: 12 },
  resultIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: font.sm, fontWeight: '700' },
  resultSub:  { fontSize: font.xs, marginTop: 2, textTransform: 'capitalize' },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: font.md, fontWeight: '900' },

  tabEmpty:   { alignItems: 'center', paddingVertical: spacing.xl },
  tabEmptyTxt: { fontSize: font.sm },
});
