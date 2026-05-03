import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../store/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import SwipeableTabs from '../../../components/SwipeableTabs';
import { font, spacing, radius, shadow, gradients } from '../../../constants/theme';

type TabType = 'my-groups' | 'discover' | 'invites';

const TABS: { key: TabType; label: string }[] = [
  { key: 'my-groups', label: 'My Groups' },
  { key: 'discover', label: 'Discover' },
  { key: 'invites', label: 'Invites' },
];

export default function CommunityScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('my-groups');
  const [refreshing, setRefreshing] = useState(false);

  const { data: groups, refetch: refetchGroups } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getGroups,
  });

  const { data: publicGroups, refetch: refetchPublic } = useQuery({
    queryKey: ['groups', 'discover'],
    queryFn: groupsApi.discoverGroups,
    enabled: activeTab === 'discover',
  });

  const myGroups = groups?.filter((g: any) => g.is_member) || [];
  const discover = publicGroups || [];

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (activeTab === 'my-groups') {
      await refetchGroups();
    } else if (activeTab === 'discover') {
      await refetchPublic();
    }
    setRefreshing(false);
  };

  const handleCreateGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    navigation.navigate('CreateGroup');
  };

  const renderGroupCard = (item: any, showJoinButton = false) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        !showJoinButton && navigation.navigate('GroupDetail', { groupId: item.id });
      }}
      activeOpacity={0.7}
      style={{ marginBottom: spacing.md }}
    >
      <Card padding="lg" shadow="md" style={styles.groupCardWrapper}>
        <View style={styles.groupCard}>
          <LinearGradient
            colors={[colors.primary + '25', colors.primary + '10']}
            style={styles.groupAvatar}
          >
            <Ionicons name={item.avatar_emoji || 'people'} size={32} color={colors.primary} />
          </LinearGradient>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.groupMeta}>
              <View style={[styles.metaBadge, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={[styles.groupMetaText, { color: colors.primary }]}>
                  {item.member_count}
                </Text>
              </View>
              {item.is_public && (
                <View style={[styles.metaBadge, { backgroundColor: colors.green + '15' }]}>
                  <Ionicons name="globe" size={14} color={colors.green} />
                  <Text style={[styles.groupMetaText, { color: colors.green }]}>Public</Text>
                </View>
              )}
            </View>
          </View>
          {showJoinButton ? (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                // Handle join
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.chevronContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const MyGroupsTab = () => (
    <FlatList
      data={myGroups}
      keyExtractor={(item: any) => item.id.toString()}
      renderItem={({ item }) => renderGroupCard(item, false)}
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          title="No Groups Yet"
          subtitle="Create or join a group to connect with others on their consistency journey"
          actionLabel="Create Group"
          onAction={handleCreateGroup}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );

  const DiscoverTab = () => (
    <FlatList
      data={discover}
      keyExtractor={(item: any) => item.id.toString()}
      renderItem={({ item }) => renderGroupCard(item, true)}
      ListEmptyComponent={
        <EmptyState
          icon="compass-outline"
          title="No Public Groups"
          subtitle="Be the first to create a public group for others to discover"
          actionLabel="Create Group"
          onAction={handleCreateGroup}
          iconColor={colors.blue}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );

  const InvitesTab = () => (
    <View style={styles.listContent}>
      <EmptyState
        icon="mail-outline"
        title="No Invites"
        subtitle="You'll see group invitations here when someone invites you"
        iconColor={colors.purple}
      />
    </View>
  );

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header
        title="Community"
        subtitle="Connect with others"
        large
        rightActions={
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateGroup}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <SwipeableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      >
        <MyGroupsTab />
        <DiscoverTab />
        <InvitesTab />
      </SwipeableTabs>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  groupCardWrapper: {
    overflow: 'hidden',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupAvatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  groupInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  groupName: {
    fontSize: font.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  groupMetaText: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: font.sm,
    fontWeight: '800',
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
});
