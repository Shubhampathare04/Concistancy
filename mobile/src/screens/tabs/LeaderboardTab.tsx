import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { spacing } from '@/constants/theme';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useSocial';

export function LeaderboardTab() {
  const { colors } = useTheme();
  const { data: leaderboard, isLoading, refetch } = useLeaderboard();

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.textMuted;
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;

    return (
      <Surface layer="bg1" rounded="lg" border style={s.card}>
        {isTopThree && (
          <LinearGradient
            colors={[getMedalColor(item.rank) + '22', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={s.cardContent}>
          <View style={s.rankBadge}>
            {isTopThree ? (
              <Ionicons name="trophy" size={20} color={getMedalColor(item.rank)} />
            ) : (
              <CText variant="body" tone="sub">#{item.rank}</CText>
            )}
          </View>

          <View style={[s.avatar, { backgroundColor: colors.primaryDim }]}>
            <CText variant="title" tone="primary">{item.name.charAt(0).toUpperCase()}</CText>
          </View>

          <View style={{ flex: 1 }}>
            <CText variant="body">{item.name}</CText>
            <View style={s.stats}>
              <View style={s.statItem}>
                <Ionicons name="flash" size={14} color={colors.warning} />
                <CText variant="micro" tone="sub">Level {item.level}</CText>
              </View>
              <View style={s.statItem}>
                <Ionicons name="flame" size={14} color={colors.error} />
                <CText variant="micro" tone="sub">{item.streak} day streak</CText>
              </View>
            </View>
          </View>

          <View style={s.xpBadge}>
            <CText variant="caption" tone="primary">{item.xp.toLocaleString()}</CText>
            <CText variant="micro" tone="muted">XP</CText>
          </View>
        </View>
      </Surface>
    );
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <CText variant="body" tone="sub">Loading leaderboard...</CText>
        </View>
      </View>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.content}>
          <Surface layer="bg1" rounded="lg" border style={s.empty}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <CText variant="title" tone="sub">No leaderboard yet</CText>
            <CText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              Connect with others to see the leaderboard
            </CText>
          </Surface>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id.toString()}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing[5],
  },
  list: {
    padding: spacing[5],
    gap: spacing[3],
  },
  card: {
    padding: spacing[4],
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rankBadge: {
    width: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  xpBadge: {
    alignItems: 'flex-end',
  },
  empty: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
});
