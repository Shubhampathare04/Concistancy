import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/ThemeContext';
import { useWeeklyTrend } from '../../features/tasks/hooks/useTasks';
import { buildHeatmapWeeks } from '../../utils/heatmapWeeks';
import Card from '../Card';
import WeeklyHeatmap from '../WeeklyHeatmap';
import { font, spacing, radius, gradients, shadow } from '../../constants/theme';

type DayBar = { label: string; count: number };

export default function ProgressTab({ dashboard, isLoading }: any) {
  const { colors } = useTheme();
  const { data: trendData } = useWeeklyTrend(12);
  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(trendData), [trendData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textDim} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading progress...</Text>
      </View>
    );
  }

  const stats = dashboard?.stats || {};
  const level = stats.level || 1;
  const totalXP = stats.total_xp || 0;
  const nextLevelXP = level * 1000;
  const xpInLevel = totalXP % nextLevelXP;
  const progress = (xpInLevel / nextLevelXP) * 100;
  
  const weeklyCompletions: DayBar[] = dashboard?.weekly_completions || [
    { label: 'Mon', count: 3 },
    { label: 'Tue', count: 5 },
    { label: 'Wed', count: 2 },
    { label: 'Thu', count: 4 },
    { label: 'Fri', count: 6 },
    { label: 'Sat', count: 1 },
    { label: 'Sun', count: 4 },
  ];

  const milestones = [
    { name: 'First Steps', target: 10, current: totalXP, unlocked: totalXP >= 10, icon: 'footsteps', color: colors.green },
    { name: 'Momentum', target: 100, current: totalXP, unlocked: totalXP >= 100, icon: 'rocket', color: colors.blue },
    { name: 'Dedicated', target: 500, current: totalXP, unlocked: totalXP >= 500, icon: 'flame', color: colors.primary },
    { name: 'Committed', target: 1000, current: totalXP, unlocked: totalXP >= 1000, icon: 'shield-checkmark', color: colors.purple },
    { name: 'Elite', target: 5000, current: totalXP, unlocked: totalXP >= 5000, icon: 'star', color: colors.yellow },
    { name: 'Master', target: 10000, current: totalXP, unlocked: totalXP >= 10000, icon: 'trophy', color: colors.yellow },
    { name: 'Legend', target: 50000, current: totalXP, unlocked: totalXP >= 50000, icon: 'diamond', color: colors.purple },
  ];

  const maxCompletions = Math.max(...weeklyCompletions.map((w: DayBar) => w.count), 1);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.content}
    >
      {/* XP Progress */}
      <Card padding="lg" shadow="md" gradient={[colors.yellow + '15', colors.yellow + '05']} borderColor={colors.yellow + '30'}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.yellow + '18' }]}>
            <Ionicons name="flash" size={18} color={colors.yellow} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>XP Progress</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Level {level} to {level + 1}</Text>
          </View>
        </View>

        <View style={styles.xpDisplay}>
          <View style={styles.xpCircleContainer}>
            <LinearGradient colors={gradients.xp} style={styles.xpCircle}>
              <Text style={styles.xpValue}>{xpInLevel}</Text>
              <Text style={styles.xpUnit}>XP</Text>
            </LinearGradient>
          </View>
          <View style={styles.xpInfo}>
            <View style={styles.xpRow}>
              <Text style={[styles.xpLabel, { color: colors.textMuted }]}>Current</Text>
              <Text style={[styles.xpNumber, { color: colors.yellow }]}>{xpInLevel}</Text>
            </View>
            <View style={styles.xpRow}>
              <Text style={[styles.xpLabel, { color: colors.textMuted }]}>Needed</Text>
              <Text style={[styles.xpNumber, { color: colors.textSub }]}>{nextLevelXP - xpInLevel}</Text>
            </View>
            <View style={styles.xpRow}>
              <Text style={[styles.xpLabel, { color: colors.textMuted }]}>Total</Text>
              <Text style={[styles.xpNumber, { color: colors.text }]}>{totalXP}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
          <LinearGradient 
            colors={gradients.xp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress}%` }]}
          >
            <View style={styles.progressShine} />
          </LinearGradient>
        </View>
        <Text style={[styles.progressPercent, { color: colors.yellow }]}>{Math.round(progress)}% Complete</Text>
      </Card>

      {/* Weekly Completions Chart */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.blue + '18' }]}>
            <Ionicons name="bar-chart" size={18} color={colors.blue} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Activity</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Last 7 days</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {weeklyCompletions.map((day: DayBar, index: number) => {
            const height = (day.count / maxCompletions) * 100;
            const isToday = index === 6;
            return (
              <TouchableOpacity
                key={index}
                style={styles.barWrapper}
                activeOpacity={0.7}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
              >
                <View style={styles.barContainer}>
                  <LinearGradient
                    colors={isToday ? gradients.primary : [colors.blue, colors.blue + 'cc']}
                    style={[styles.bar, { height: `${height}%` }]}
                  >
                    <Text style={styles.barValue}>{day.count}</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.barLabel, { 
                  color: isToday ? colors.primary : colors.textMuted,
                  fontWeight: isToday ? '700' : '600'
                }]}>{day.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card padding="lg" shadow="md" gradient={[colors.green + '10', colors.primary + '06']} borderColor={colors.border}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="git-commit-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Consistency heatmap</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>GitHub-style intensity · recent weeks</Text>
          </View>
        </View>
        <WeeklyHeatmap weeks={heatmapWeeks} />
      </Card>

      {/* Milestones */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '18' }]}>
            <Ionicons name="ribbon" size={18} color={colors.purple} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Milestones</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your journey</Text>
          </View>
        </View>

        <View style={styles.milestonesContainer}>
          {milestones.map((milestone, index) => {
            const isUnlocked = milestone.unlocked;
            const progressPercent = Math.min((milestone.current / milestone.target) * 100, 100);
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.milestoneCard, {
                  backgroundColor: isUnlocked ? milestone.color + '15' : colors.surface,
                  borderColor: isUnlocked ? milestone.color + '40' : colors.border,
                  opacity: isUnlocked ? 1 : 0.6,
                }]}
                activeOpacity={0.7}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
              >
                <View style={[styles.milestoneIcon, { 
                  backgroundColor: isUnlocked ? milestone.color + '20' : colors.border 
                }]}>
                  <Ionicons 
                    name={isUnlocked ? milestone.icon as any : 'lock-closed'} 
                    size={24} 
                    color={isUnlocked ? milestone.color : colors.textDim} 
                  />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneName, { 
                    color: isUnlocked ? colors.text : colors.textMuted 
                  }]}>{milestone.name}</Text>
                  <Text style={[styles.milestoneTarget, { color: colors.textMuted }]}>
                    {milestone.current >= milestone.target ? milestone.target : milestone.current} / {milestone.target} XP
                  </Text>
                  {!isUnlocked && (
                    <View style={[styles.milestoneProgress, { backgroundColor: colors.border }]}>
                      <View style={[styles.milestoneProgressFill, { 
                        backgroundColor: milestone.color,
                        width: `${progressPercent}%` 
                      }]} />
                    </View>
                  )}
                </View>
                {isUnlocked && (
                  <Ionicons name="checkmark-circle" size={24} color={milestone.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: font.md,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: font.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: font.xs,
    marginTop: 2,
  },

  // XP Display
  xpDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  xpCircleContainer: {
    position: 'relative',
  },
  xpCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  xpValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 32,
  },
  xpUnit: {
    fontSize: font.xs,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.9,
  },
  xpInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  xpNumber: {
    fontSize: font.lg,
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  progressShine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressPercent: {
    fontSize: font.sm,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: spacing.sm,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  barValue: {
    fontSize: font.xs,
    fontWeight: '800',
    color: '#fff',
  },
  barLabel: {
    fontSize: font.xs,
  },

  // Milestones
  milestonesContainer: {
    gap: spacing.sm,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
    gap: 4,
  },
  milestoneName: {
    fontSize: font.md,
    fontWeight: '700',
  },
  milestoneTarget: {
    fontSize: font.xs,
  },
  milestoneProgress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
