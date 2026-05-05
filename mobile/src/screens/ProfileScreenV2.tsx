import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { spacing, shadow } from '@/constants/theme';
import { Surface } from '@/components/primitives/Surface';
import { CText } from '@/components/primitives/CText';

export function ProfileScreenV2() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={{ gap: spacing[1] }}>
          <CText variant="sectionLabel" tone="muted">Identity</CText>
          <CText variant="heroTitle">{user?.name ?? 'Consistency athlete'}</CText>
          <CText variant="caption" tone="sub">You’re not “trying”. You’re training.</CText>
        </View>

        <Surface layer="bg1" rounded="xl" border style={[s.hero, shadow.sm]}>
          <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <Surface layer="bg2" rounded="xl" border style={s.avatar}>
              <Ionicons name="person" size={22} color={colors.primary2} />
            </Surface>
            <View style={{ flex: 1 }}>
              <CText variant="title">Goal of the season</CText>
              <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
                Build a daily ritual so consistent it feels automatic.
              </CText>
            </View>
          </View>
        </Surface>

        <Surface layer="bg1" rounded="xl" border style={[s.card, shadow.sm]}>
          <CText variant="title">Achievements</CText>
          <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
            (Next) Animated badge cabinet with rarity + unlock moments.
          </CText>
          <View style={s.badges}>
            {['First Win', '3-Day Fire', 'Week Warrior', 'Level Up'].map((b, i) => (
              <Surface key={i} layer="bg2" rounded="lg" border style={s.badge}>
                <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                <CText variant="micro" tone="sub">{b}</CText>
              </Surface>
            ))}
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[20], gap: spacing[4] },
  hero: { padding: spacing[5], overflow: 'hidden' },
  avatar: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  card: { padding: spacing[5] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing[3] },
  badge: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
});

