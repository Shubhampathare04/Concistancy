import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius, font } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'surface';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function Button({ label, onPress, variant = 'primary', loading, disabled, style, icon }: Props) {
  const { colors } = useTheme();

  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'danger' ? colors.red :
    variant === 'surface' ? colors.card :
    'transparent';

  const borderColor =
    variant === 'ghost' ? colors.border :
    variant === 'surface' ? colors.border :
    'transparent';

  const textColor =
    variant === 'ghost' ? colors.textSub :
    variant === 'surface' ? colors.text :
    '#fff';

  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg, borderColor, borderWidth: variant === 'ghost' || variant === 'surface' ? 1 : 0, opacity: disabled ? 0.5 : 1 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[s.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontWeight: '700', fontSize: font.md, letterSpacing: 0.2 },
});
