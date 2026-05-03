import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../../store/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../../services/api';
import SwipeableTabs from '../../../components/SwipeableTabs';
import OverviewTab from '../../../components/insights/OverviewTab';
import ProgressTab from '../../../components/insights/ProgressTab';
import ActivityTab from '../../../components/insights/ActivityTab';
import RecordsTab from '../../../components/insights/RecordsTab';

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
