import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { CText } from './primitives/CText';
import { spacing, radius } from '@/constants/theme';

type Props = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
};

export function StaticXPBar({ level, xpInLevel, xpToNext }: Props) {
  const { colors } = useTheme();
  const percentage = Math.min((xpInLevel / xpToNext) * 100, 100);

  return (
    <View style={s.container}>
      <View style={s.labelRow}>
        <CText variant="micro" tone="muted">Level {level}</CText>
        <CText variant="micro" tone="muted">{xpInLevel} / {xpToNext} XP</CText>
      </View>
      <View style={[s.track, { backgroundColor: colors.bg2 }]}>
        <View
          style={[
            s.fill,
            {
              width: `${percentage}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
