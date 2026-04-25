import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius, font, spacing } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({ label, error, leftIcon, rightIcon, style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.wrapper}>
      {label && <Text style={[s.label, { color: colors.textMuted }]}>{label}</Text>}
      <View style={[s.row, { backgroundColor: colors.card, borderColor: error ? colors.red : colors.border }]}>
        {leftIcon && <View style={s.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[s.input, { color: colors.text, flex: 1 }, style]}
          placeholderTextColor={colors.textDim}
          selectionColor={colors.primary}
          {...props}
        />
        {rightIcon && <View style={s.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={[s.error, { color: colors.red }]}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: font.sm, marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md },
  input: { paddingVertical: 14, fontSize: font.md },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  error: { fontSize: font.xs, marginTop: 4 },
});
