import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { spacing } from '@/constants/theme';
import { useFeed, ActivityFeedItem } from '@/hooks/useSocial';

export function FeedTab() {
  const { colors } = useTheme();
  const { data: feed, isLoading, refetch } = useFeed();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return 'checkmark-circle';
      case 'level_up':
        return 'trophy';
      case 'streak_milestone':
        return 'flame';
      case 'group_joined':
        return 'people';
      case 'challenge_completed':
        return 'ribbon';
      default:
        return 'flash';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return colors.success;
      case 'level_up':
        return colors.warning;
      case 'streak_milestone':
        return colors.error;
      case 'group_joined':
        return colors.primary;
      case 'challenge_completed':
        return colors.primary2;
      default:
        return colors.textMuted;
    }
  };

  const formatActivityMessage = (item: ActivityFeedItem) => {
    return item.data || `${item.user.name} performed an activity`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ActivityFeedItem }) => (
    <Surface layer="bg1" rounded="lg" border style={s.card}>
      <View style={s.cardContent}>
        <View style={[s.iconBox, { backgroundColor: getActivityColor(item.activity_type) + '22' }]}>
          <Ionicons name={getActivityIcon(item.activity_type)} size={20} color={getActivityColor(item.activity_type)} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.header}>
            <CText variant="body">{item.user.name}</CText>
            <CText variant="micro" tone="muted">{formatTime(item.created_at)}</CText>
          </View>
          <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
            {formatActivityMessage(item)}
          </CText>
        </View>
      </View>
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <CText variant="body" tone="sub">Loading feed...</CText>
        </View>
      </View>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.content}>
          <Surface layer="bg1" rounded="lg" border style={s.empty}>
            <Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />
            <CText variant="title" tone="sub">No activity yet</CText>
            <CText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
              Connect with others to see their activities
            </CText>
          </Surface>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
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
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empty: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
});
