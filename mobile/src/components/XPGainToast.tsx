import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients } from '@/constants/theme';

interface Props {
  xp: number;
  onDone: () => void;
}

export default function XPGainToast({ xp, onDone }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale      = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,      { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1,   duration: 180,             useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -50, duration: 1100,            useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(onDone);
    }, 900);

    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY }, { scale }] }]}>
      <LinearGradient colors={gradients.xp} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.pill}>
        <Ionicons name="flash" size={14} color="#000" />
        <Text style={s.text}>+{xp} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', alignSelf: 'center', top: 100, zIndex: 999 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
  },
  text: { color: '#000', fontWeight: '900', fontSize: 15 },
});
