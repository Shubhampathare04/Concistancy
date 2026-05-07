import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { spacing, radius } from '@/constants/theme';
import { useGroups, useDiscoverGroups, Group } from '@/hooks/useSocial';

export function GroupsTab() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const { data: myGroups, isLoading: loadingMy, refetch: refetchMy } = useGroups();
  const { data: discoverGroups, isLoading: loadingDiscover, refetch: refetchDiscover } = useDiscoverGroups();

  const handleRefresh = () => {
    refetchMy();
    refetchDiscover();
  };

  const renderGroup = ({ item, isMember }: { item: Group; isMember: boolean }) => (
    <TouchableOpacity
      onPress={() => nav.navigate('GroupDetail', { groupId: item.id })}
    >
      <Surface layer="bg1" rounded="lg" border style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.groupAvatar, { backgroundColor: colors.primaryDim }]}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <CText variant="body">{item.name}</CText>
              {item.is_private && (
                <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              )}
            </View>
            {item.description && (
              <CText variant="caption" tone="sub" numberOfLines={2}>
                {item.description}
              </CText>
            )}
            <View style={s.meta}>
              <View style={s.metaItem}>
                <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                <CText variant="micro" tone="muted">{item.member_count} members</CText>
              </View>
            </View>
          </View>
        </View>
        {!isMember && (
          <TouchableOpacity style={[s.joinBtn, { backgroundColor: colors.primary }]}>
            <CText variant="caption" style={{ color: '#fff' }}>Join Group</CText>
          </TouchableOpacity>
        )}
      </Surface>
    </TouchableOpacity>
  );

  if (loadingMy && loadingDiscover) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <CText variant="body" tone="sub">Loading groups...</CText>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View style={s.content}>
            {/* Create Group Button */}
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => nav.navigate('CreateGroup')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <CText variant="body" style={{ color: '#fff' }}>Create Group</CText>
            </TouchableOpacity>

            {/* My Groups */}
            <View style={s.section}>
              <CText variant="sectionLabel" tone="muted">
                My Groups ({myGroups?.length || 0})
              </CText>
              {myGroups && myGroups.length > 0 ? (
                myGroups.map((group) => (
                  <View key={group.id}>{renderGroup({ item: group, isMember: true })}</View>
                ))
              ) : (
                <Surface layer="bg1" rounded="lg" border style={s.empty}>
                  <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                  <CText variant="body" tone="sub">No groups yet</CText>
                  <CText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                    Create or join a group to connect with others
                  </CText>
                </Surface>
              )}
            </View>

            {/* Discover Groups */}
            {discoverGroups && discoverGroups.length > 0 && (
              <View style={s.section}>
                <CText variant="sectionLabel" tone="muted">Discover Groups</CText>
                {discoverGroups.map((group) => (
                  <View key={group.id}>{renderGroup({ item: group, isMember: false })}</View>
                ))}
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loadingMy || loadingDiscover}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
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
    padding: spacing[5],
    gap: spacing[5],
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  section: {
    gap: spacing[3],
  },
  card: {
    padding: spacing[4],
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  meta: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  joinBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  empty: {
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
});
