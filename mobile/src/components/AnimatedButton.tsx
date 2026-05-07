import { ReactNode } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

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
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const palette =
    variant === 'primary'
      ? { bg: '#ff6b35', fg: '#fff', border: 'transparent' }
      : variant === 'secondary'
        ? { bg: 'rgba(255,255,255,0.12)', fg: '#f5f5f5', border: 'rgba(255,255,255,0.2)' }
        : { bg: 'transparent', fg: '#a0a0a0', border: 'rgba(255,255,255,0.08)' };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        s.btn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        disabled && s.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[s.txt, { color: palette.fg }, labelStyle]}>{label}</Text>
    </TouchableOpacity>
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
