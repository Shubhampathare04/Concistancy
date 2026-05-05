import { ReactNode } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function lightHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export default function AnimatedButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
  labelStyle,
}: Props) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      runOnJS(lightHaptic)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const palette =
    variant === 'primary'
      ? { bg: '#ff6b35', fg: '#fff', border: 'transparent' }
      : variant === 'secondary'
        ? { bg: 'rgba(255,255,255,0.12)', fg: '#f5f5f5', border: 'rgba(255,255,255,0.2)' }
        : { bg: 'transparent', fg: '#a0a0a0', border: 'rgba(255,255,255,0.08)' };

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          s.btn,
          { backgroundColor: palette.bg, borderColor: palette.border },
          disabled && s.disabled,
          animStyle,
          style,
        ]}
      >
        {icon}
        <Text style={[s.txt, { color: palette.fg }, labelStyle]}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
  },
  txt: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  disabled: { opacity: 0.45 },
});
