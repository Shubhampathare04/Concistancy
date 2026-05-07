import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { Surface } from '@/components/primitives/Surface';
import { spacing, radius } from '@/constants/theme';
import { useConnections, useAcceptConnection, useRejectConnection, Connection } from '@/hooks/useSocial';

export function ConnectionsTab() {
  const { colors } = useTheme();
  const { data: connections, isLoading, refetch } = useConnections();
  const acceptMutation = useAcceptConnection();
  const rejectMutation = useRejectConnection();

  const pendingRequests = connections?.filter((c) => c.status === 'pending') || [];
  const acceptedConnections = connections?.filter((c) => c.status === 'accepted') || [];

  const handleAccept = (connectionId: number) => {
    acceptMutation.mutate(connectionId);
  };

  const handleReject = (connectionId: number) => {
    rejectMutation.mutate(connectionId);
  };

  const renderPendingRequest = ({ item }: { item: Connection }) => {
    const isReceived = item.connected_user_id !== item.user_id;
    const user = isReceived ? item.user : item.connected_user;

    return (
      <Surface layer="bg1" rounded="lg" border style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: colors.primaryDim }]}>
            <CText variant="title" tone="primary">{user.name.charAt(0).toUpperCase()}</CText>
          </View>
          <View style={{ flex: 1 }}>
            <CText variant="body">{user.name}</CText>
            <CText variant="caption" tone="sub">{user.email}</CText>
          </View>
        </View>
        {isReceived && (
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => handleAccept(item.id)}
              disabled={acceptMutation.isPending}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <CText variant="caption" style={{ color: '#fff' }}>Accept</CText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.bg2 }]}
              onPress={() => handleReject(item.id)}
              disabled={rejectMutation.isPending}
            >
              <Ionicons name="close" size={18} color={colors.textSub} />
              <CText variant="caption" tone="sub">Reject</CText>
            </TouchableOpacity>
          </View>
        )}
        {!isReceived && (
          <View style={s.statusBadge}>
            <CText variant="micro" tone="muted">Pending</CText>
          </View>
        )}
      </Surface>
    );
  };

  const renderConnection = ({ item }: { item: Connection }) => {
    const user = item.user_id === item.connected_user_id ? item.user : item.connected_user;

    return (
      <Surface layer="bg1" rounded="lg" border style={s.card}>
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: colors.primaryDim }]}>
            <CText variant="title" tone="primary">{user.name.charAt(0).toUpperCase()}</CText>
          </View>
          <View style={{ flex: 1 }}>
            <CText variant="body">{user.name}</CText>
            <CText variant="caption" tone="sub">{user.email}</CText>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSub} />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  };

  if (isLoading) {
    return (
      <View style={[s.container, { backgroundColor: colors.bg0 }]}>
        <View style={s.loading}>
          <CText variant="body" tone="sub">Loading connections...</CText>
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
            {pendingRequests.length > 0 && (
              <View style={s.section}>
                <CText variant="sectionLabel" tone="muted">Pending Requests ({pendingRequests.length})</CText>
                {pendingRequests.map((item) => (
                  <View key={item.id}>{renderPendingRequest({ item })}</View>
                ))}
              </View>
            )}

            <View style={s.section}>
              <CText variant="sectionLabel" tone="muted">
                Connections ({acceptedConnections.length})
              </CText>
              {acceptedConnections.length === 0 ? (
                <Surface layer="bg1" rounded="lg" border style={s.empty}>
                  <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                  <CText variant="body" tone="sub">No connections yet</CText>
                  <CText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                    Connect with others to share your journey
                  </CText>
                </Surface>
              ) : (
                acceptedConnections.map((item) => (
                  <View key={item.id}>{renderConnection({ item })}</View>
                ))
              )}
            </View>
          </View>
        }
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
    padding: spacing[5],
    gap: spacing[5],
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
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  empty: {
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
});
