import { PropsWithChildren, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/store/ThemeContext';
import { radius, shadow, spacing } from '@/constants/theme';
import { haptics } from '@/hooks/useHaptics';

type Props = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>;

export function BottomSheet({ visible, onClose, children }: Props) {
  const { colors } = useTheme();
  const p = useSharedValue(0);
  const y = useSharedValue(420);

  useEffect(() => {
    if (visible) {
      p.value = withTiming(1, { duration: 220 });
      y.value = withSpring(0, { damping: 18, stiffness: 180 });
      return;
    }
    p.value = withTiming(0, { duration: 180 });
    y.value = withTiming(420, { duration: 180 });
  }, [visible, p, y]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      y.value = Math.max(0, e.translationY);
    })
    .onEnd(() => {
      if (y.value > 120) {
        y.value = withTiming(420, { duration: 180 }, () => runOnJS(onClose)());
        runOnJS(haptics.light)();
      } else {
        y.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const overlay = useAnimatedStyle(() => ({
    opacity: p.value,
  }));
  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, overlay]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.sheet, sheet, { backgroundColor: colors.bg1, borderColor: colors.strokeSubtle }]}>
          <View style={[s.grabber, { backgroundColor: colors.textMuted }]} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    ...shadow.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    marginBottom: spacing[4],
  },
});

