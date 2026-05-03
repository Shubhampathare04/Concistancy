import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../store/ThemeContext';
import Card from '../Card';
import { font, spacing, radius, gradients, shadow } from '../../constants/theme';

export default function ActivityTab({ dashboard, isLoading }: any) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={48} color={colors.textDim} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading activity...</Text>
      </View>
    );
  }

  const performanceWindows = dashboard?.performance_windows || { best_hour: 9, avg_completions: 3.2 };
  const recentActivity = dashboard?.recent_activity || [];
  const moodTrend = dashboard?.mood_trend || { avg_mood: 4.2, avg_energy: 3.8 };
  const focusSessions = dashboard?.focus_sessions || { total_minutes: 240, sessions: 8 };

  // Generate 30-day calendar
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayData = dashboard?.calendar_data?.find((d: any) => d.date === date.toISOString().split('T')[0]);
    const completed = dayData?.completed || 0;
    const total = dayData?.total || 0;
    const intensity = total > 0 ? completed / total : 0;
    return { date, completed, total, intensity };
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return colors.border;
    if (intensity < 0.33) return colors.yellow + '60';
    if (intensity < 0.66) return colors.primary + '80';
    if (intensity < 1) return colors.primary;
    return colors.green;
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.content}
    >
      {/* 30-Day Calendar */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '18' }]}>
            <Ionicons name="calendar" size={18} color={colors.purple} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>30-Day Activity</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your consistency map</Text>
          </View>
        </View>

        <View style={styles.calendar}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.calendarDay, { backgroundColor: getIntensityColor(day.intensity) }]}
              activeOpacity={0.7}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})}
            >
              <Text style={[styles.calendarDayText, { 
                color: day.intensity > 0 ? '#fff' : colors.textMuted 
              }]}>
                {day.date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legendRow}>
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Less</Text>
          <View style={styles.legendDots}>
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
              <View key={i} style={[styles.legendDot, { backgroundColor: getIntensityColor(intensity) }]} />
            ))}
          </View>
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>More</Text>
        </View>
      </Card>

      {/* Performance Windows */}
      <Card padding="lg" shadow="sm" gradient={[colors.blue + '12', colors.blue + '04']} borderColor={colors.blue + '30'}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.blue + '18' }]}>
            <Ionicons name="time" size={18} color={colors.blue} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Peak Performance</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Your best time</Text>
          </View>
        </View>

        <View style={styles.performanceDisplay}>
          <View style={styles.performanceCircle}>
            <LinearGradient colors={gradients.blue} style={styles.performanceGradient}>
              <Ionicons name="sunny" size={32} color="#fff" />
              <Text style={styles.performanceHour}>{performanceWindows.best_hour}:00</Text>
            </LinearGradient>
          </View>
          <View style={styles.performanceInfo}>
            <Text style={[styles.performanceLabel, { color: colors.textMuted }]}>
              You complete an average of
            </Text>
            <Text style={[styles.performanceValue, { color: colors.blue }]}>
              {performanceWindows.avg_completions} tasks
            </Text>
            <Text style={[styles.performanceLabel, { color: colors.textMuted }]}>
              during this hour
            </Text>
          </View>
        </View>
      </Card>

      {/* Focus Sessions */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="stopwatch" size={18} color={colors.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Time</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>This week</Text>
          </View>
        </View>

        <View style={styles.focusGrid}>
          <View style={[styles.focusCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.focusValue, { color: colors.primary }]}>{focusSessions.total_minutes}</Text>
            <Text style={[styles.focusLabel, { color: colors.textMuted }]}>Minutes</Text>
          </View>
          <View style={[styles.focusCard, { backgroundColor: colors.green + '15', borderColor: colors.green + '30' }]}>
            <Ionicons name="checkmark-done-outline" size={24} color={colors.green} />
            <Text style={[styles.focusValue, { color: colors.green }]}>{focusSessions.sessions}</Text>
            <Text style={[styles.focusLabel, { color: colors.textMuted }]}>Sessions</Text>
          </View>
        </View>
      </Card>

      {/* Mood & Energy */}
      <Card padding="lg" shadow="sm">
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.yellow + '18' }]}>
            <Ionicons name="happy" size={18} color={colors.yellow} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood & Energy</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Weekly average</Text>
          </View>
        </View>

        <View style={styles.moodGrid}>
          <View style={styles.moodCard}>
            <Text style={[styles.moodLabel, { color: colors.textMuted }]}>Mood</Text>
            <View style={styles.moodDisplay}>
              <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.moodCircle}>
                <Text style={styles.moodValue}>{moodTrend.avg_mood.toFixed(1)}</Text>
              </LinearGradient>
              <View style={styles.moodStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= moodTrend.avg_mood ? 'star' : 'star-outline'} 
                    size={16} 
                    color={colors.yellow} 
                  />
                ))}
              </View>
            </View>
          </View>
          <View style={styles.moodCard}>
            <Text style={[styles.moodLabel, { color: colors.textMuted }]}>Energy</Text>
            <View style={styles.moodDisplay}>
              <LinearGradient colors={gradients.primary} style={styles.moodCircle}>
                <Text style={styles.moodValue}>{moodTrend.avg_energy.toFixed(1)}</Text>
              </LinearGradient>
              <View style={styles.moodStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= moodTrend.avg_energy ? 'flash' : 'flash-outline'} 
                    size={16} 
                    color={colors.primary} 
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card padding="lg" shadow="sm">
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.green + '18' }]}>
              <Ionicons name="list" size={18} color={colors.green} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Latest updates</Text>
            </View>
          </View>

          <View style={styles.activityList}>
            {recentActivity.map((activity: any, index: number) => (
              <View key={index} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.activityDot, { backgroundColor: colors.green }]} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, { color: colors.text }]}>{activity.text}</Text>
                  <Text style={[styles.activityTime, { color: colors.textMuted }]}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
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

  // Calendar
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  calendarDay: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  calendarDayText: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  legendLabel: {
    fontSize: font.xs,
  },
  legendDots: {
    flexDirection: 'row',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  // Performance
  performanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  performanceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  performanceGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadow.md,
  },
  performanceHour: {
    fontSize: font.xl,
    fontWeight: '900',
    color: '#fff',
  },
  performanceInfo: {
    flex: 1,
    gap: 4,
  },
  performanceLabel: {
    fontSize: font.sm,
  },
  performanceValue: {
    fontSize: font.xxl,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Focus
  focusGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  focusCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  focusValue: {
    fontSize: font.xxxl,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  focusLabel: {
    fontSize: font.sm,
    fontWeight: '600',
  },

  // Mood
  moodGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  moodCard: {
    flex: 1,
    gap: spacing.md,
  },
  moodLabel: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  moodDisplay: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  moodValue: {
    fontSize: font.xl,
    fontWeight: '900',
    color: '#fff',
  },
  moodStars: {
    flexDirection: 'row',
    gap: 2,
  },

  // Activity
  activityList: {
    gap: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityText: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: font.xs,
  },
});
