import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';

interface Props {
  children: React.ReactNode;
  padded?: boolean;
}

export default function ScreenWrapper({ children, padded = true }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={[{ flex: 1, backgroundColor: colors.bg }, padded && { paddingHorizontal: 20 }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
