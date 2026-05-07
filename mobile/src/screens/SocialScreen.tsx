import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { CText } from '@/components/primitives/CText';
import { spacing } from '@/constants/theme';
import { ConnectionsTab } from './tabs/ConnectionsTab';
import { GroupsTab } from './tabs/GroupsTab';
import { LeaderboardTab } from './tabs/LeaderboardTab';
import { FeedTab } from './tabs/FeedTab';

type Tab = 'connections' | 'groups' | 'leaderboard' | 'feed';

export function SocialScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('connections');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'connections', label: 'Connections' },
    { key: 'groups', label: 'Groups' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'feed', label: 'Feed' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'connections':
        return <ConnectionsTab />;
      case 'groups':
        return <GroupsTab />;
      case 'leaderboard':
        return <LeaderboardTab />;
      case 'feed':
        return <FeedTab />;
      default:
        return null;
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bg0, borderBottomColor: colors.strokeSubtle }]}>
        <CText variant="heroTitle">Social</CText>
        <CText variant="caption" tone="sub">Connect, compete, and grow together</CText>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: colors.bg0, borderBottomColor: colors.strokeSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  s.tab,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <CText
                  variant="body"
                  tone={isActive ? 'primary' : 'sub'}
                  style={{ fontWeight: isActive ? '700' : '600' }}
                >
                  {tab.label}
                </CText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={s.content}>{renderContent()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabScroll: {
    paddingHorizontal: spacing[5],
  },
  tab: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginRight: spacing[2],
  },
  content: {
    flex: 1,
  },
});
