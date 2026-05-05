import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { typography } from '@/constants/theme';

type Tone = 'default' | 'sub' | 'muted' | 'primary' | 'success' | 'warning' | 'error';
type Variant =
  | 'heroNumber'
  | 'heroTitle'
  | 'sectionLabel'
  | 'title'
  | 'body'
  | 'bodyRegular'
  | 'micro'
  | 'caption';

export type CTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function CText({ variant = 'bodyRegular', tone = 'default', style, ...props }: CTextProps) {
  const { colors } = useTheme();
  const color =
    tone === 'default' ? colors.text :
    tone === 'sub' ? colors.textSub :
    tone === 'muted' ? colors.textMuted :
    tone === 'primary' ? colors.primary :
    tone === 'success' ? colors.success :
    tone === 'warning' ? colors.warning :
    colors.error;

  return (
    <RNText
      {...props}
      style={[
        { color },
        typography[variant],
        style,
      ]}
    />
  );
}

