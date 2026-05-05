import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/store/ThemeContext';
import { motion } from '@/utils/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size: number;
  strokeWidth: number;
  progress: number; // 0..1
  start?: number; // 0..1 for offset rotation
};

export function CircularProgressRing({ size, strokeWidth, progress, start = -0.25 }: Props) {
  const { colors } = useTheme();
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  const p = useDerivedValue(() =>
    withTiming(Math.max(0, Math.min(1, progress)), {
      duration: motion.duration.slow,
      easing: motion.easing.standard,
    })
  );

  const animatedProps = useAnimatedProps(() => {
    const dashOffset = c * (1 - p.value);
    return {
      strokeDashoffset: dashOffset,
    } as any;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.primary2} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.strokeSubtle}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
          originX={size / 2}
          originY={size / 2}
          rotation={start * 360}
        />
      </Svg>
    </View>
  );
}

