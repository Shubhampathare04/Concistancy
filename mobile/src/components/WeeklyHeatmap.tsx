/**
 * WeeklyHeatmap — 7-column grid showing daily completion intensity.
 * Uses color saturation to encode completion rate per day.
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { font, radius, spacing } from '@/constants/theme';

interface WeekDay {
  date: string;       // ISO date string
  completions: number;
  maxPossible: number;
}

interface Props {
  weeks: WeekDay[][];  // Array of 7-day arrays, oldest first
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getIntensityColor(rate: number, isDark: boolean): string {
  if (rate === 0) return isDark ? '#1a1a1a' : '#f0f0f0';
  if (rate < 0.25) return isDark ? '#ff6b3520' : '#ff6b3530';
  if (rate < 0.5)  return isDark ? '#ff6b3550' : '#ff6b3560';
  if (rate < 0.75) return isDark ? '#ff6b3580' : '#ff6b3590';
  return '#ff6b35';
}

export default function WeeklyHeatmap({ weeks }: Props) {
  const { colors, isDark } = useTheme();

  if (!weeks || weeks.length === 0) {
    return (
      <View style={[s.empty, { backgroundColor: colors.surface }]}>
        <Text style={[s.emptyTxt, { color: colors.textMuted }]}>No data yet — complete tasks to see your heatmap</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Day labels */}
      <View style={s.dayRow}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={[s.dayLabel, { color: colors.textDim }]}>{d}</Text>
        ))}
      </View>

      {/* Grid — each row is a week */}
      {weeks.map((week, wi) => (
        <View key={wi} style={s.weekRow}>
          {week.map((day, di) => {
            const rate = day.maxPossible > 0 ? day.completions / day.maxPossible : 0;
            const bg = getIntensityColor(rate, isDark);
            const isToday = day.date === new Date().toISOString().split('T')[0];
            return (
              <View
                key={di}
                style={[
                  s.cell,
                  { backgroundColor: bg },
                  isToday && { borderWidth: 1.5, borderColor: colors.primary },
                ]}
              />
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={s.legend}>
        <Text style={[s.legendTxt, { color: colors.textDim }]}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <View key={i} style={[s.legendCell, { backgroundColor: getIntensityColor(r, isDark) }]} />
        ))}
        <Text style={[s.legendTxt, { color: colors.textDim }]}>More</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 3 },
  dayRow: { flexDirection: 'row', gap: 3, marginBottom: 2 },
  dayLabel: { width: 28, textAlign: 'center', fontSize: font.xs, fontWeight: '600' },
  weekRow: { flexDirection: 'row', gap: 3 },
  cell: { width: 28, height: 28, borderRadius: radius.xs },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, justifyContent: 'flex-end' },
  legendCell: { width: 14, height: 14, borderRadius: 3 },
  legendTxt: { fontSize: font.xs },
  empty: { padding: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
  emptyTxt: { fontSize: font.sm, textAlign: 'center' },
});
