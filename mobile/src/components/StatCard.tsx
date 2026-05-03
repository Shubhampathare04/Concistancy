import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius, font, spacing } from '@/constants/theme';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

export default function StatCard({ icon, label, value, color }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  const displayValue = useCountUp(value, 700);

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: c + '20' }]}>
      <View style={[s.iconWrap, { backgroundColor: c + '12' }]}>
        {icon}
      </View>
      <Text style={[s.value, { color: c }]}>{displayValue}</Text>
      <Text style={[s.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: font.xxl, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: font.xs, fontWeight: '600', letterSpacing: 0.3 },
});
