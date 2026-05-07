import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';

type Props = {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
};

export function StaticProgressRing({ size, strokeWidth, progress }: Props) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(Math.max(progress, 0), 1);
  
  return (
    <View style={[s.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          s.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.bg2,
          },
        ]}
      />
      {/* Progress overlay - simple approximation using border */}
      <View
        style={[
          s.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.primary,
            borderTopColor: progressValue > 0.75 ? colors.primary : 'transparent',
            borderRightColor: progressValue > 0.5 ? colors.primary : 'transparent',
            borderBottomColor: progressValue > 0.25 ? colors.primary : 'transparent',
            borderLeftColor: progressValue > 0 ? colors.primary : 'transparent',
            opacity: progressValue,
          },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
});
