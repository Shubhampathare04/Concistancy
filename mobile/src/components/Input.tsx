import { useRef, useCallback, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Animated } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius, font, spacing } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({ label, error, leftIcon, rightIcon, style, onFocus, onBlur, value, ...props }: Props) {
  const { colors } = useTheme();
  const focusAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.(e);
  }, [onBlur]);

  // Shake on error
  const prevError = useRef('');
  if (error && error !== prevError.current) {
    prevError.current = error;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  }

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.red : colors.border, error ? colors.red : colors.primary],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const hasValue = value !== undefined ? value.length > 0 : false;
  const labelFloat = isFocused || hasValue;

  return (
    <View style={s.wrapper}>
      <Animated.View style={[
        s.container,
        {
          backgroundColor: colors.card,
          borderColor,
          shadowColor: error ? colors.red : colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          shadowRadius: 10,
          elevation: 0,
          transform: [{ translateX: shakeAnim }],
        },
      ]}>
        {leftIcon && (
          <View style={s.iconLeft}>{leftIcon}</View>
        )}
        <View style={s.inputWrap}>
          {label && (
            <Text style={[
              s.floatLabel,
              {
                color: labelFloat
                  ? (error ? colors.red : isFocused ? colors.primary : colors.textMuted)
                  : colors.textMuted,
                fontSize: labelFloat ? font.xs : font.md,
                top: labelFloat ? 8 : 18,
              },
            ]}>
              {label}
            </Text>
          )}
          <TextInput
            style={[
              s.input,
              { color: colors.text, paddingTop: label ? 22 : 0 },
              style,
            ]}
            placeholderTextColor={label ? 'transparent' : colors.textMuted}
            selectionColor={colors.primary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            {...props}
          />
        </View>
        {rightIcon && (
          <View style={s.iconRight}>{rightIcon}</View>
        )}
      </Animated.View>
      {error ? (
        <Text style={[s.errorTxt, { color: colors.red }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    minHeight: 58,
  },
  inputWrap:  { flex: 1, justifyContent: 'center', position: 'relative' },
  floatLabel: {
    position: 'absolute',
    left: 0,
    fontWeight: '500',
    zIndex: 1,
  },
  input: {
    fontSize: font.md,
    paddingVertical: 0,
    height: 58,
  },
  iconLeft:  { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  errorTxt:  { fontSize: font.xs, marginTop: 4, marginLeft: 4, fontWeight: '500' },
});
