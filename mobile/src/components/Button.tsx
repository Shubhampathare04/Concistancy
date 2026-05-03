import { Animated, TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { useAnimatedPress } from '@/hooks/useAnimatedPress';
import { radius, font, gradients, glow } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'surface';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  label, onPress, variant = 'primary',
  loading, disabled, style, icon, size = 'lg',
}: Props) {
  const { colors } = useTheme();
  const { onPressIn, onPressOut, style: pressStyle } = useAnimatedPress({ scale: 0.97 });

  const isDisabled = disabled || loading;

  const paddingV = size === 'sm' ? 10 : size === 'md' ? 13 : 16;
  const fontSize  = size === 'sm' ? font.sm : size === 'md' ? font.md : font.md;

  const textColor =
    variant === 'ghost'   ? colors.textSub :
    variant === 'surface' ? colors.text :
    '#fff';

  const content = loading
    ? <ActivityIndicator color={textColor} size="small" />
    : <>{icon}<Text style={[s.label, { color: textColor, fontSize }]}>{label}</Text></>;

  return (
    <Animated.View style={[
      pressStyle,
      { opacity: isDisabled ? 0.45 : 1 },
      variant === 'primary' && !isDisabled && glow.primary,
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={1}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.btn, { paddingVertical: paddingV, borderRadius: radius.lg }]}
          >
            {content}
          </LinearGradient>
        ) : (
          <Animated.View style={[
            s.btn,
            { paddingVertical: paddingV, borderRadius: radius.lg },
            variant === 'danger'   && { backgroundColor: colors.red + '18', borderColor: colors.red + '50', borderWidth: 1 },
            variant === 'surface'  && { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            variant === 'ghost'    && { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 },
          ]}>
            {content}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontWeight: '700', letterSpacing: 0.2 },
});
