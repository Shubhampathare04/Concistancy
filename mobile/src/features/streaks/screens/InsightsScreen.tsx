import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../../services/api';
import SwipeableTabs from '../../../components/SwipeableTabs';
import OverviewTab from '../../../components/insights/OverviewTab';
import ProgressTab from '../../../components/insights/ProgressTab';
import ActivityTab from '../../../components/insights/ActivityTab';
import RecordsTab from '../../../components/insights/RecordsTab';
import { spacing, type } from '../../../constants/theme';

type TabType = 'overview' | 'progress' | 'activity' | 'records';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'progress', label: 'Progress' },
  { key: 'activity', label: 'Activity' },
  { key: 'records', label: 'Records' },
];

export default function InsightsScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: statsApi.getDashboard,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.hero}>
        <LinearGradient
          colors={isDark ? [colors.primary + '25', 'transparent'] : [colors.primary + '18', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.heroKicker, { color: colors.primary }, type.section]}>Momentum lab</Text>
        <Text style={[styles.heroTitle, { color: colors.text }, type.title]}>Your trajectory</Text>
        <Text style={[styles.heroSub, { color: colors.textMuted }, type.caption]}>
          Interactive charts, heatmaps, and milestones — built like a premium data product.
        </Text>
      </View>
      <SwipeableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
      >
        <OverviewTab dashboard={dashboard} isLoading={isLoading} />
        <ProgressTab dashboard={dashboard} isLoading={isLoading} />
        <ActivityTab dashboard={dashboard} isLoading={isLoading} />
        <RecordsTab dashboard={dashboard} isLoading={isLoading} />
      </SwipeableTabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  heroKicker: { marginBottom: 4 },
  heroTitle: { marginBottom: 6 },
  heroSub: { maxWidth: 320, lineHeight: 20 },
});
