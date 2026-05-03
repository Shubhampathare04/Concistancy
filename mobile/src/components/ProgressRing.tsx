/**
 * ProgressRing
 * Pure React Native animated circular progress ring.
 * Uses two half-circle rotation technique — no SVG dependency needed.
 */
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  size: number;
  strokeWidth: number;
  progress: number;   // 0–1
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}

export default function ProgressRing({ size, strokeWidth, progress, color, trackColor, children }: Props) {
  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animPct, {
      toValue: Math.min(progress, 1),
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const r     = (size - strokeWidth) / 2;
  const inner = size - strokeWidth * 2;

  // Left half rotation: 0% → 0deg, 50% → 180deg
  const leftRot = animPct.interpolate({
    inputRange:  [0, 0.5, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Right half rotation: 0–50% stays at 0deg, 50–100% → 0–180deg
  const rightRot = animPct.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Right half only visible after 50%
  const rightOpacity = animPct.interpolate({
    inputRange:  [0, 0.499, 0.5],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const halfStyle = {
    width: size / 2,
    height: size,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
  };

  const arcStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: strokeWidth,
    borderColor: color,
    backgroundColor: 'transparent',
    position: 'absolute' as const,
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={[arcStyle, { borderColor: trackColor }]} />

      {/* Left half (first 50%) */}
      <View style={[halfStyle, { left: 0 }]}>
        <Animated.View style={[arcStyle, { transform: [{ rotate: leftRot }] }]} />
      </View>

      {/* Right half (second 50%) */}
      <Animated.View style={[halfStyle, { right: 0, opacity: rightOpacity }]}>
        <Animated.View style={[arcStyle, { left: -size / 2, transform: [{ rotate: rightRot }] }]} />
      </Animated.View>

      {/* Inner content */}
      <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
