import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { radius } from '@/constants/theme';

type Layer = 'bg0' | 'bg1' | 'bg2';

export type SurfaceProps = ViewProps & {
  layer?: Layer;
  rounded?: keyof typeof radius;
  border?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Surface({ layer = 'bg1', rounded = 'lg', border = false, style, ...props }: SurfaceProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors[layer],
          borderRadius: radius[rounded],
          borderWidth: border ? 1 : 0,
          borderColor: border ? colors.strokeSubtle : 'transparent',
        },
        style,
      ]}
    />
  );
}

