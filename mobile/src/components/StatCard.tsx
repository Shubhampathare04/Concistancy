import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius, font, spacing } from '@/constants/theme';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

export default function StatCard({ icon, label, value, color }: Props) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: c + '30' }]}>
      <View style={[s.iconWrap, { backgroundColor: c + '18' }]}>{icon}</View>
      <Text style={[s.value, { color: c }]}>{value}</Text>
      <Text style={[s.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, gap: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: font.xxl, fontWeight: '800' },
  label: { fontSize: font.xs, fontWeight: '500' },
});
