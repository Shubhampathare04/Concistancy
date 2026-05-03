import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { spacing, radius, shadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: readonly [string, string];
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  borderColor?: string;
}

export default function Card({
  children,
  onPress,
  gradient,
  style,
  padding = 'md',
  shadow: shadowSize = 'sm',
  borderColor,
}: CardProps) {
  const { colors } = useTheme();

  const paddingMap = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const shadowMap = {
    none: {},
    sm: shadow.sm,
    md: shadow.md,
    lg: shadow.lg,
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: borderColor || colors.border,
      padding: paddingMap[padding],
    },
    shadowMap[shadowSize],
    style,
  ];

  const content = (
    <>
      {gradient && (
        <LinearGradient
          colors={gradient as any}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
