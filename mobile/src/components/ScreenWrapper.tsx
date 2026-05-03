import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';

interface Props {
  children: React.ReactNode;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function ScreenWrapper({ children, padded = true, edges = ['top', 'bottom', 'left', 'right'] }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      <View style={[{ flex: 1, backgroundColor: colors.bg }, padded && { paddingHorizontal: 20 }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
