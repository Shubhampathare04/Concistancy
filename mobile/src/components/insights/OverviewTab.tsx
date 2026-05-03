import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/ThemeContext';
import Card from '../Card';
import { font, spacing, radius, gradients, shadow } from '../../constants/theme';

export default function OverviewTab({ dashboard, isLoading }: any) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textDim} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading insights...</Text>
      </View>
    );
  }

  const stats = dashboard?.stats || {};
  const insights = dashboard?.ai_insights || [];
  const todayStats = dashboard?.today_stats || { completed: 0, total: 0 };
  const weekDelta = dashboard?.week_delta || { completions: 0, ci_delta: 0 };

  const level = stats.level || 1;
  const streak = stats.current_streak || 0;
  const xp = stats.total_xp || 0;
  const coins = stats.coins || 0;
  const ci = stats.consistency_index || 0;

  const todayProgress = todayStats.total > 0 ? (todayStats.completed / todayStats.total) * 100 : 0;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.content}
    >
      {/* Hero Stats Card */}
      <Card gradient={[colors.primary + '15', colors.primary + '05']} padding="lg" shadow="md" borderColor={colors.primary + '30'}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={[styles.heroLabel, { color: colors.textMuted }]}>YOUR LEVEL</Text>
            <View style={styles.levelRow}>
              <LinearGradient colors={gradients.primary} style={styles.levelBadge}>
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.levelText}>{level}</Text>
              </LinearGradient>
              <Text style={[styles.levelTitle, { color: colors.text }]}>Champion</Text>
            </View>
          </View>
          <View style={[styles.coinsContainer, { backgroundColor: colors.yellow + '18', borderColor: colors.yellow + '40' }]}>
            <Ionicons name="diamond" size={18} color={colors.yellow} />
            <Text style={[styles.coinsText, { color: colors.yellow }]}>{coins}</Text>
          </View>
        </View>

        {/* Today's Progress Ring */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Today's Progress</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>
              {todayStats.completed} / {todayStats.total} tasks
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
            <LinearGradient 
              colors={todayProgress === 100 ? gradients.success : gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${todayProgress}%` }]}
            >
              <View style={styles.progressShine} />
            </LinearGradient>
          </View>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(todayProgress)}%</Text>
        </View>
      </Card>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { icon: 'flame', label: 'Streak', value: streak, unit: 'd', color: colors.primary, gradient: ['#ff6b35', '#ff3d00'] },
          { icon: 'flash', label: 'Total XP', value: xp, unit: '', color: colors.yellow, gradient: ['#fbbf24', '#f59e0b'] },
          { icon: 'analytics', label: 'CI Score', value: ci, unit: '%', color: colors.blue, gradient: ['#60a5fa', '#3b82f6'] },
          { icon: 'checkmark-done', label: 'Done', value: todayStats.completed, unit: '', color: colors.green, gradient: ['#34d399', '#10b981'] },
        ].map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: stat.color + '25' }]}
            activeOpacity={0.7}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
          >
            <LinearGradient colors={[stat.color + '15', stat.color + '05']} style={StyleSheet.absoluteFill} />
            <View style={[styles.statIconWrap, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}{stat.unit}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Consistency Index */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.blue + '18' }]}>
            <Ionicons name="analytics" size={18} color={colors.blue} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Consistency Index</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your reliability score</Text>
          </View>
        </View>
        
        <View style={styles.ciDisplay}>
          <LinearGradient 
            colors={ci >= 80 ? gradients.success : ci >= 50 ? gradients.xp : ['#f87171', '#ef4444']}
            style={styles.ciCircle}
          >
            <Text style={styles.ciValue}>{ci}</Text>
            <Text style={styles.ciUnit}>%</Text>
          </LinearGradient>
          <View style={styles.ciInfo}>
            <Text style={[styles.ciLabel, { color: colors.text }]}>
              {ci >= 80 ? '🔥 Outstanding!' : ci >= 50 ? '💪 Good Progress' : '📈 Keep Building'}
            </Text>
            <Text style={[styles.ciDescription, { color: colors.textMuted }]}>
              {ci >= 80 
                ? 'You\'re crushing it! Maintain this momentum.'
                : ci >= 50 
                ? 'You\'re on the right track. Stay consistent!'
                : 'Complete tasks daily to improve your score.'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Week Over Week */}
      <Card 
        padding="lg" 
        shadow="sm"
        gradient={weekDelta.ci_delta >= 0 ? [colors.green + '12', colors.green + '04'] : [colors.red + '12', colors.red + '04']}
        borderColor={weekDelta.ci_delta >= 0 ? colors.green + '30' : colors.red + '30'}
      >
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: (weekDelta.ci_delta >= 0 ? colors.green : colors.red) + '18' }]}>
            <Ionicons 
              name={weekDelta.ci_delta >= 0 ? 'trending-up' : 'trending-down'} 
              size={18} 
              color={weekDelta.ci_delta >= 0 ? colors.green : colors.red} 
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Week Over Week</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your weekly progress</Text>
          </View>
        </View>

        <View style={styles.deltaGrid}>
          <View style={styles.deltaCard}>
            <Text style={[styles.deltaLabel, { color: colors.textMuted }]}>Completions</Text>
            <View style={styles.deltaValueRow}>
              <Text style={[styles.deltaValue, { color: weekDelta.completions >= 0 ? colors.green : colors.red }]}>
                {weekDelta.completions >= 0 ? '+' : ''}{weekDelta.completions}
              </Text>
              <Ionicons 
                name={weekDelta.completions >= 0 ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color={weekDelta.completions >= 0 ? colors.green : colors.red} 
              />
            </View>
          </View>
          <View style={styles.deltaCard}>
            <Text style={[styles.deltaLabel, { color: colors.textMuted }]}>CI Delta</Text>
            <View style={styles.deltaValueRow}>
              <Text style={[styles.deltaValue, { color: weekDelta.ci_delta >= 0 ? colors.green : colors.red }]}>
                {weekDelta.ci_delta >= 0 ? '+' : ''}{weekDelta.ci_delta}%
              </Text>
              <Ionicons 
                name={weekDelta.ci_delta >= 0 ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color={weekDelta.ci_delta >= 0 ? colors.green : colors.red} 
              />
            </View>
          </View>
        </View>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card padding="lg" shadow="sm" gradient={[colors.purple + '12', colors.purple + '04']} borderColor={colors.purple + '30'}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '18' }]}>
              <Ionicons name="bulb" size={18} color={colors.purple} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Personalized recommendations</Text>
            </View>
          </View>
          {insights.map((insight: string, i: number) => (
            <View key={i} style={styles.insightRow}>
              <View style={[styles.insightDot, { backgroundColor: colors.purple }]} />
              <Text style={[styles.insightText, { color: colors.textSub }]}>{insight}</Text>
            </View>
          ))}
        </Card>
      )}
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

  // Hero Card
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  heroLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  levelText: {
    fontSize: font.lg,
    fontWeight: '900',
    color: '#fff',
  },
  levelTitle: {
    fontSize: font.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  coinsText: {
    fontSize: font.md,
    fontWeight: '800',
  },

  // Progress Section
  progressSection: {
    gap: spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: font.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 14,
    borderRadius: radius.full,
    overflow: 'hidden',
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
    fontSize: font.xs,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.sm,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: font.xxl,
    fontWeight: '900',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: font.xs,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
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

  // CI Display
  ciDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ciCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  ciValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 40,
  },
  ciUnit: {
    fontSize: font.sm,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.9,
  },
  ciInfo: {
    flex: 1,
    gap: 4,
  },
  ciLabel: {
    fontSize: font.md,
    fontWeight: '700',
  },
  ciDescription: {
    fontSize: font.sm,
    lineHeight: 18,
  },

  // Delta Grid
  deltaGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deltaCard: {
    flex: 1,
    gap: spacing.sm,
  },
  deltaLabel: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  deltaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deltaValue: {
    fontSize: font.xxxl,
    fontWeight: '900',
    letterSpacing: -1.5,
  },

  // Insights
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: font.sm,
    lineHeight: 20,
  },
});
