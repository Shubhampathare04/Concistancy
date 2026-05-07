import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboard } from '@/features/tasks/hooks/useTasks';
import { spacing, shadow } from '@/constants/theme';
import { Surface } from '@/components/primitives/Surface';
import { CText } from '@/components/primitives/CText';

export function ProfileScreenV2() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data } = useDashboard();

  const stats = [
    { label: 'Current Streak', value: `${data?.streak ?? 0} days`, icon: 'flame', color: colors.orange },
    { label: 'Total XP', value: `${data?.xp ?? 0}`, icon: 'star', color: colors.yellow },
    { label: 'Level', value: `${data?.level ?? 1}`, icon: 'trophy', color: colors.primary },
    { label: 'Completions', value: `${data?.total_completions ?? 0}`, icon: 'checkmark-circle', color: colors.green },
  ];

  const menuItems = [
    { label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    { label: 'Achievements', icon: 'ribbon-outline', screen: null },
    { label: 'Statistics', icon: 'bar-chart-outline', screen: 'Progress' },
    { label: 'Friends', icon: 'people-outline', screen: 'Social' },
  ];

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    logout();
  };

  return (
    <View style={[s.container, { backgroundColor: colors.bg0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={{ gap: spacing[1] }}>
          <CText variant="sectionLabel" tone="muted">Profile</CText>
          <CText variant="heroTitle">{user?.name ?? 'Consistency Athlete'}</CText>
          <CText variant="caption" tone="sub">{user?.email}</CText>
        </View>

        {/* Profile Card */}
        <Surface layer="bg1" rounded="xl" border style={[s.hero, shadow.sm]}>
          <LinearGradient colors={[colors.primaryWash, 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
            <Surface layer="bg2" rounded="full" border style={s.avatar}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </Surface>
            <View style={{ flex: 1 }}>
              <CText variant="title">{user?.name ?? 'User'}</CText>
              <CText variant="caption" tone="sub" style={{ marginTop: spacing[1] }}>
                Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </CText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] }}>
                <View style={[s.badge, { backgroundColor: colors.primaryWash }]}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                  <CText variant="micro" tone="primary">Verified</CText>
                </View>
                <View style={[s.badge, { backgroundColor: colors.yellowWash }]}>
                  <Ionicons name="star" size={14} color={colors.yellow} />
                  <CText variant="micro" style={{ color: colors.yellow }}>Level {data?.level ?? 1}</CText>
                </View>
              </View>
            </View>
          </View>
        </Surface>

        {/* Stats Grid */}
        <View>
          <CText variant="sectionLabel" tone="muted" style={{ marginBottom: spacing[3] }}>Your Stats</CText>
          <View style={s.statsGrid}>
            {stats.map((stat, i) => (
              <Surface key={i} layer="bg1" rounded="xl" border style={[s.statCard, shadow.sm]}>
                <View style={[s.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <CText variant="title" style={{ marginTop: spacing[2] }}>{stat.value}</CText>
                <CText variant="micro" tone="sub">{stat.label}</CText>
              </Surface>
            ))}
          </View>
        </View>

        {/* Achievements Preview */}
        <Surface layer="bg1" rounded="xl" border style={[s.card, shadow.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <CText variant="title">Achievements</CText>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
            >
              <CText variant="caption" tone="primary">View All</CText>
            </TouchableOpacity>
          </View>
          <View style={s.badges}>
            {[
              { name: 'First Win', icon: 'trophy', color: colors.yellow },
              { name: '3-Day Fire', icon: 'flame', color: colors.orange },
              { name: 'Week Warrior', icon: 'shield', color: colors.primary },
              { name: 'Level Up', icon: 'star', color: colors.purple },
            ].map((b, i) => (
              <Surface key={i} layer="bg2" rounded="lg" border style={s.badgeItem}>
                <View style={[s.badgeIcon, { backgroundColor: b.color + '20' }]}>
                  <Ionicons name={b.icon as any} size={18} color={b.color} />
                </View>
                <CText variant="micro" tone="sub" style={{ marginTop: spacing[1] }}>{b.name}</CText>
              </Surface>
            ))}
          </View>
        </Surface>

        {/* Menu Items */}
        <Surface layer="bg1" rounded="xl" border style={[s.card, shadow.sm]}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[s.menuItem, i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.strokeSubtle }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                if (item.screen) nav.navigate(item.screen);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <View style={[s.menuIcon, { backgroundColor: colors.bg2 }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.text} />
                </View>
                <CText variant="body">{item.label}</CText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Surface>

        {/* Logout Button */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: colors.red + '15', borderColor: colors.red + '30' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.red} />
          <CText variant="body" style={{ color: colors.red }}>Logout</CText>
        </TouchableOpacity>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: spacing[4] }}>
          <CText variant="micro" tone="muted">Consistency App v1.0.0</CText>
          <CText variant="micro" tone="muted" style={{ marginTop: spacing[1] }}>Made for consistency athletes</CText>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[20], gap: spacing[4] },
  hero: { padding: spacing[5], overflow: 'hidden' },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  statCard: { flex: 1, minWidth: '45%', padding: spacing[4], alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { padding: spacing[5] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  badgeItem: { flex: 1, minWidth: '22%', padding: spacing[3], alignItems: 'center' },
  badgeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[4] },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4], borderRadius: 12, borderWidth: 1 },
});
