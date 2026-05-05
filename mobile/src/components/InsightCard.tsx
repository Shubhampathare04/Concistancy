import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius, type } from '@/constants/theme';
import { AIInsight } from '@/features/tasks/types';

const META: Record<
  string,
  { icon: string; label: string; colorKey: 'primary' | 'blue' | 'yellow' | 'red' | 'purple' }
> = {
  warning: { icon: 'alert-circle-outline', label: 'Coach note', colorKey: 'yellow' },
  suggestion: { icon: 'bulb-outline', label: 'Smart tip', colorKey: 'purple' },
  achievement: { icon: 'trophy-outline', label: 'Win', colorKey: 'yellow' },
};

interface Props {
  insight: AIInsight;
  onPress?: () => void;
}

export default function InsightCard({ insight, onPress }: Props) {
  const { colors } = useTheme();
  const meta = META[insight.type] ?? META.suggestion;
  const accent = colors[meta.colorKey] ?? colors.primary;

  const inner = (
    <>
      <View style={[s.accent, { backgroundColor: accent }]} />
      <View style={[s.iconWrap, { backgroundColor: accent + '22' }]}>
        <Ionicons name={meta.icon as any} size={20} color={accent} />
      </View>
      <View style={s.body}>
        <Text style={[s.kicker, { color: accent }, type.micro]}>{meta.label}</Text>
        <Text style={[s.msg, { color: colors.textSub }, type.caption]} numberOfLines={3}>
          {insight.message}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        activeOpacity={0.88}
      >
        <LinearGradient colors={[accent + '14', accent + '04']} style={StyleSheet.absoluteFill} />
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={[accent + '14', accent + '04']} style={StyleSheet.absoluteFill} />
      {inner}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  kicker: { textTransform: 'uppercase', letterSpacing: 1 },
  msg: { lineHeight: 20, fontWeight: '600' },
});
