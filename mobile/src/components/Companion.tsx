/**
 * Companion — evolving visual entity that reflects user consistency.
 * CRED-style: no emojis, pure geometric + icon design.
 */
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';

interface Props {
  streak: number;
  consistencyIndex: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const STAGES = [
  { min: 0,  icon: 'leaf-outline',      color: '#4ade80', grad: ['#4ade8030', '#4ade8008'] as const },
  { min: 3,  icon: 'trending-up',       color: '#34d399', grad: ['#34d39930', '#34d39908'] as const },
  { min: 7,  icon: 'flame',             color: '#f97316', grad: ['#f9731630', '#f9731608'] as const },
  { min: 14, icon: 'flash',             color: '#fbbf24', grad: ['#fbbf2430', '#fbbf2408'] as const },
  { min: 30, icon: 'diamond',           color: '#a78bfa', grad: ['#a78bfa30', '#a78bfa08'] as const },
] as const;

function getStage(streak: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (streak >= STAGES[i].min) return STAGES[i];
  }
  return STAGES[0];
}

export default function Companion({ streak, consistencyIndex, level, size = 'md' }: Props) {
  const { colors } = useTheme();
  const stage = getStage(streak);

  const scale      = useRef(new Animated.Value(1)).current;
  const auraScale  = useRef(new Animated.Value(1)).current;
  const auraOpacity = useRef(new Animated.Value(0.5)).current;

  const dim       = size === 'sm' ? 52 : size === 'lg' ? 88 : 68;
  const iconSize  = size === 'sm' ? 20 : size === 'lg' ? 36 : 28;
  const pulseDur  = streak >= 30 ? 600 : streak >= 7 ? 900 : 1400;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: pulseDur, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.97, duration: pulseDur, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(auraScale,   { toValue: 1.35, duration: pulseDur * 1.2, useNativeDriver: true }),
      Animated.timing(auraScale,   { toValue: 1.0,  duration: pulseDur * 1.2, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(auraOpacity, { toValue: 0.7, duration: pulseDur, useNativeDriver: true }),
      Animated.timing(auraOpacity, { toValue: 0.2, duration: pulseDur, useNativeDriver: true }),
    ])).start();
  }, [streak]);

  const glowOpacity = Math.max(0.15, Math.min(0.7, consistencyIndex / 100 * 0.6 + 0.1));

  return (
    <View style={[s.container, { width: dim, height: dim }]}>
      {/* Aura ring */}
      <Animated.View style={[
        s.aura,
        {
          width: dim * 1.6, height: dim * 1.6,
          borderRadius: dim,
          backgroundColor: stage.color + '18',
          shadowColor: stage.color,
          shadowOpacity: glowOpacity,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
        },
        { transform: [{ scale: auraScale }], opacity: auraOpacity },
      ]} />

      {/* Body */}
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <LinearGradient
          colors={stage.grad}
          style={[s.body, {
            width: dim, height: dim,
            borderRadius: dim / 2,
            borderColor: stage.color + '50',
          }]}
        >
          <Ionicons name={stage.icon as any} size={iconSize} color={stage.color} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  aura:      { position: 'absolute' },
  body:      { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
