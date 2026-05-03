import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius } from '@/constants/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
  transparent?: boolean;
  large?: boolean;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightActions,
  transparent = false,
  large = false,
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: transparent ? 'transparent' : colors.bg,
            borderBottomColor: transparent ? 'transparent' : colors.border,
          },
          large && styles.containerLarge,
        ]}
      >
        <View style={styles.content}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.backButton,
                {
                  backgroundColor: transparent ? colors.surface + 'cc' : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  large && styles.titleLarge,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {rightActions && <View style={styles.rightActions}>{rightActions}</View>}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  containerLarge: {
    paddingBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: font.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleLarge: {
    fontSize: font.xxl,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: font.sm,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
