import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export function Toast({ visible, message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success || '#10b981',
          bg: (colors.success || '#10b981') + '20',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: colors.error || '#ef4444',
          bg: (colors.error || '#ef4444') + '20',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: colors.warning || '#f59e0b',
          bg: (colors.warning || '#f59e0b') + '20',
        };
      case 'info':
        return {
          icon: 'information-circle' as const,
          color: colors.primary || '#3b82f6',
          bg: (colors.primary || '#3b82f6') + '20',
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        s.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.bg,
          borderColor: config.color + '40',
        },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[s.message, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
