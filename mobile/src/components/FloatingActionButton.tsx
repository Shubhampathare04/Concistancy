import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/store/ThemeContext';
import { AnimatedPressable } from '@/components/primitives/AnimatedPressable';
import { gradients, radius, shadow, spacing } from '@/constants/theme';
import { haptics } from '@/hooks/useHaptics';

type Props = {
  onPress: () => void;
  icon?: any;
};

export function FloatingActionButton({ onPress, icon = 'add' }: Props) {
  const { colors } = useTheme();

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1, { damping: 12, stiffness: 160 }) }],
  }));

  return (
    <Animated.View style={[s.wrap, aStyle]}>
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => {
          haptics.medium();
          onPress();
        }}
        style={s.press}
      >
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, shadow.lg]}>
          <Ionicons name={icon as any} size={26} color={colors.white} />
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing[6],
    bottom: spacing[16],
  },
  press: { borderRadius: radius.pill },
  btn: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

