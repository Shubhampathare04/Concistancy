import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius, shadow } from '@/constants/theme';

interface AnimatedBadgeProps {
  icon: string;
  label: string;
  color: string;
  delay?: number;
  onPress?: () => void;
}

export default function AnimatedBadge({ icon, label, color, delay = 0, onPress }: AnimatedBadgeProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 3, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={!onPress}
    >
      <Animated.View
        style={[
          s.container,
          { backgroundColor: colors.surface, borderColor: color + '30', transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={[color + '15', color + '05']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[s.iconWrap, { backgroundColor: color + '20', transform: [{ rotate }] }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </Animated.View>
        <Text style={[s.label, { color: colors.textSub }]} numberOfLines={2}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    minWidth: 100,
    overflow: 'hidden',
    ...shadow.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: font.xs,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
});
