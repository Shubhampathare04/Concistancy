import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/ThemeContext';
import Card from '../Card';
import { font, spacing, radius, gradients, shadow } from '../../constants/theme';

export default function RecordsTab({ dashboard, isLoading }: any) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textDim} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading records...</Text>
      </View>
    );
  }

  const stats = dashboard?.stats || {};
  const badges = [
    { name: 'First Win', icon: 'trophy', color: colors.yellow, unlocked: true },
    { name: '7-Day Streak', icon: 'flame', color: colors.primary, unlocked: (stats.current_streak || 0) >= 7 },
    { name: '30-Day Streak', icon: 'flash', color: colors.primary, unlocked: (stats.current_streak || 0) >= 30 },
    { name: 'Level 5', icon: 'star', color: colors.yellow, unlocked: (stats.level || 0) >= 5 },
    { name: 'Level 10', icon: 'star-half', color: colors.purple, unlocked: (stats.level || 0) >= 10 },
    { name: '1000 XP', icon: 'rocket', color: colors.blue, unlocked: (stats.total_xp || 0) >= 1000 },
  ];
  
  const habitStreaks = dashboard?.habit_streaks || [];
  const xpMultiplier = dashboard?.xp_multiplier || { active: false, next_window: '18:00' };

  const records = [
    { label: 'Best Streak', value: stats.best_streak || 0, unit: 'days', icon: 'flame', color: colors.primary },
    { label: 'Total XP', value: stats.total_xp || 0, unit: '', icon: 'flash', color: colors.yellow },
    { label: 'Completions', value: stats.total_completions || 0, unit: '', icon: 'checkmark-done', color: colors.green },
    { label: 'Perfect Days', value: stats.perfect_days || 0, unit: '', icon: 'star', color: colors.purple },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.content}
    >
      {/* Personal Records */}
      <Card padding="lg" shadow="md" gradient={[colors.yellow + '15', colors.yellow + '05']} borderColor={colors.yellow + '30'}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.yellow + '18' }]}>
            <Ionicons name="trophy" size={18} color={colors.yellow} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Records</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your best achievements</Text>
          </View>
        </View>

        <View style={styles.recordsGrid}>
          {records.map((record, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.recordCard, { 
                backgroundColor: record.color + '15',
                borderColor: record.color + '30'
              }]}
              activeOpacity={0.7}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
            >
              <View style={[styles.recordIcon, { backgroundColor: record.color + '20' }]}>
                <Ionicons name={record.icon as any} size={24} color={record.color} />
              </View>
              <Text style={[styles.recordValue, { color: record.color }]}>
                {record.value}{record.unit}
              </Text>
              <Text style={[styles.recordLabel, { color: colors.textMuted }]}>{record.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Badges */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '18' }]}>
            <Ionicons name="ribbon" size={18} color={colors.purple} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges Earned</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {badges.filter(b => b.unlocked).length} of {badges.length} unlocked
            </Text>
          </View>
        </View>

        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.badgeCard, {
                backgroundColor: badge.unlocked ? badge.color + '15' : colors.surface,
                borderColor: badge.unlocked ? badge.color + '30' : colors.border,
                opacity: badge.unlocked ? 1 : 0.5,
              }]}
              activeOpacity={0.7}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
            >
              <View style={[styles.badgeIconWrap, {
                backgroundColor: badge.unlocked ? badge.color + '20' : colors.border
              }]}>
                <Ionicons 
                  name={badge.unlocked ? badge.icon as any : 'lock-closed'} 
                  size={32} 
                  color={badge.unlocked ? badge.color : colors.textDim} 
                />
              </View>
              <Text style={[styles.badgeName, { 
                color: badge.unlocked ? colors.text : colors.textMuted 
              }]}>{badge.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Habit Streaks */}
      {habitStreaks.length > 0 && (
        <Card padding="lg" shadow="sm">
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.green + '18' }]}>
              <Ionicons name="leaf" size={18} color={colors.green} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Habit Streaks</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Active habits</Text>
            </View>
          </View>

          <View style={styles.habitsList}>
            {habitStreaks.map((habit: any, index: number) => (
              <View key={index} style={[styles.habitRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.habitIcon, { backgroundColor: colors.green + '18' }]}>
                  <Ionicons name="leaf" size={16} color={colors.green} />
                </View>
                <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
                <View style={styles.habitStreak}>
                  <Text style={[styles.habitStreakValue, { color: colors.primary }]}>{habit.streak}d</Text>
                  <Ionicons name="flame" size={16} color={colors.primary} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* XP Multiplier */}
      <Card 
        padding="lg" 
        shadow="sm"
        gradient={xpMultiplier.active ? [colors.green + '15', colors.green + '05'] : [colors.surface, colors.surface]}
        borderColor={xpMultiplier.active ? colors.green + '30' : colors.border}
      >
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { 
            backgroundColor: xpMultiplier.active ? colors.green + '18' : colors.border 
          }]}>
            <Ionicons 
              name={xpMultiplier.active ? 'flash' : 'flash-outline'} 
              size={18} 
              color={xpMultiplier.active ? colors.green : colors.textDim} 
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>XP Multiplier</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {xpMultiplier.active ? 'Active now' : 'Inactive'}
            </Text>
          </View>
        </View>

        {xpMultiplier.active ? (
          <View style={styles.multiplierActive}>
            <LinearGradient colors={gradients.success} style={styles.multiplierBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.multiplierText}>2x XP Active</Text>
            </LinearGradient>
            <Text style={[styles.multiplierSubtext, { color: colors.textMuted }]}>
              Ends in 45 minutes
            </Text>
          </View>
        ) : (
          <View style={styles.multiplierInactive}>
            <View style={[styles.multiplierIcon, { backgroundColor: colors.border }]}>
              <Ionicons name="time-outline" size={32} color={colors.textDim} />
            </View>
            <Text style={[styles.multiplierLabel, { color: colors.textMuted }]}>
              Next window at {xpMultiplier.next_window}
            </Text>
            <Text style={[styles.multiplierHint, { color: colors.textDim }]}>
              Complete tasks during multiplier windows to earn 2x XP
            </Text>
          </View>
        )}
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

  // Records
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recordCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordValue: {
    fontSize: font.xxl,
    fontWeight: '900',
    letterSpacing: -1,
  },
  recordLabel: {
    fontSize: font.xs,
    fontWeight: '600',
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '31%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  badgeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: font.xs,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Habits
  habitsList: {
    gap: spacing.sm,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  habitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitName: {
    flex: 1,
    fontSize: font.sm,
    fontWeight: '600',
  },
  habitStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStreakValue: {
    fontSize: font.md,
    fontWeight: '800',
  },

  // Multiplier
  multiplierActive: {
    alignItems: 'center',
    gap: spacing.md,
  },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadow.md,
  },
  multiplierText: {
    fontSize: font.lg,
    fontWeight: '800',
    color: '#fff',
  },
  multiplierSubtext: {
    fontSize: font.sm,
  },
  multiplierInactive: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  multiplierIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  multiplierLabel: {
    fontSize: font.md,
    fontWeight: '700',
  },
  multiplierHint: {
    fontSize: font.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
});
