import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboard } from '@/features/tasks/hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import type { ThemeMode } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { font, spacing, radius } from '@/constants/theme';

const LEVEL_TITLES = ['Beginner', 'Apprentice', 'Consistent', 'Dedicated', 'Expert', 'Master', 'Legend', 'Mythic'];

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data } = useDashboard();
  const { colors, mode, setMode, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const streak = data?.streak ?? 0;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={14} color={colors.textMuted} />
      <Text style={[s.sectionHeaderTxt, { color: colors.textMuted }]}>{title}</Text>
    </View>
  );

  const MenuItem = ({ icon, iconColor = colors.primary, label, value, onPress, rightEl }: any) => (
    <TouchableOpacity
      style={[s.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !rightEl}
    >
      <View style={[s.menuIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[s.menuLabel, { color: colors.text }]}>{label}</Text>
      {rightEl ?? (
        value ? <Text style={[s.menuValue, { color: colors.textMuted }]}>{value}</Text>
          : onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textDim} /> : null
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={[s.userName, { color: colors.text }]}>{user?.name ?? 'User'}</Text>
          <Text style={[s.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
          <View style={[s.titleBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
            <Ionicons name="star" size={12} color={colors.primary} />
            <Text style={[s.titleBadgeTxt, { color: colors.primary }]}>{levelTitle}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[s.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: 'Streak', value: streak, color: colors.primary, icon: 'flame' },
            { label: 'XP', value: xp, color: colors.yellow, icon: 'flash' },
            { label: 'Level', value: level, color: colors.purple, icon: 'shield-checkmark' },
          ].map((item, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
              <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLbl, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Appearance */}
        <SectionHeader icon="color-palette-outline" title="APPEARANCE" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.themeLabel, { color: colors.textMuted }]}>Theme</Text>
          <View style={s.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                style={[s.themeBtn, { backgroundColor: colors.surface, borderColor: mode === opt.mode ? colors.primary : colors.border },
                  mode === opt.mode && { backgroundColor: colors.primaryDim }]}
                onPress={() => setMode(opt.mode)}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.icon as any} size={20} color={mode === opt.mode ? colors.primary : colors.textMuted} />
                <Text style={[s.themeBtnTxt, { color: mode === opt.mode ? colors.primary : colors.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader icon="notifications-outline" title="NOTIFICATIONS" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="notifications-outline" iconColor={colors.blue} label="Push Notifications"
            rightEl={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
          <MenuItem icon="volume-medium-outline" iconColor={colors.green} label="Sound"
            rightEl={<Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
          <MenuItem icon="alarm-outline" iconColor={colors.yellow} label="Daily Reminder"
            rightEl={<Switch value={dailyReminder} onValueChange={setDailyReminder} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
        </View>

        {/* Account */}
        <SectionHeader icon="person-outline" title="ACCOUNT" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="person-outline" iconColor={colors.purple} label="Name" value={user?.name ?? '—'} />
          <MenuItem icon="mail-outline" iconColor={colors.blue} label="Email" value={user?.email ?? '—'} />
          <MenuItem icon="shield-checkmark-outline" iconColor={colors.green} label="Account Status" value="Active" />
          <MenuItem icon="key-outline" iconColor={colors.yellow} label="Change Password" onPress={() => Alert.alert('Coming Soon', 'Password change will be available in the next update.')} />
        </View>

        {/* App Info */}
        <SectionHeader icon="information-circle-outline" title="APP" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="code-slash-outline" iconColor={colors.textMuted} label="Version" value="1.0.0" />
          <MenuItem icon="hardware-chip-outline" iconColor={colors.textMuted} label="AI Engine" value="Rule-based v1" />
          <MenuItem icon="cloud-offline-outline" iconColor={colors.green} label="Offline Mode" value="Enabled" />
          <MenuItem icon="server-outline" iconColor={colors.textMuted} label="Backend" value="FastAPI" />
          <MenuItem icon="document-text-outline" iconColor={colors.blue} label="Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally and on your private server.')} />
          <MenuItem icon="help-circle-outline" iconColor={colors.yellow} label="Help & Support" onPress={() => Alert.alert('Support', 'Contact: support@consistency.app')} />
        </View>

        {/* Danger Zone */}
        <SectionHeader icon="warning-outline" title="DANGER ZONE" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="trash-outline" iconColor={colors.red} label="Clear All Data"
            onPress={() => Alert.alert('Clear Data', 'This will delete all your local data. Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => {} },
            ])} />
          <TouchableOpacity style={[s.logoutBtn, { backgroundColor: colors.redDim, borderColor: colors.red + '40' }]} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={[s.logoutTxt, { color: colors.red }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.footer, { color: colors.textDim }]}>Consistency App • Made for champions</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarTxt: { color: '#fff', fontSize: 36, fontWeight: '800' },
  userName: { fontSize: font.xl, fontWeight: '800' },
  userEmail: { fontSize: font.sm, marginTop: 4 },
  titleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  titleBadgeTxt: { fontSize: font.sm, fontWeight: '700' },
  statsRow: { flexDirection: 'row', borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: font.xxl, fontWeight: '900' },
  statLbl: { fontSize: font.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, marginTop: spacing.md, paddingHorizontal: 4 },
  sectionHeaderTxt: { fontSize: font.xs, fontWeight: '700', letterSpacing: 1 },
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.sm },
  themeLabel: { fontSize: font.xs, fontWeight: '600', paddingHorizontal: spacing.md, paddingTop: spacing.md, marginBottom: spacing.sm },
  themeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
  themeBtn: { flex: 1, alignItems: 'center', gap: 6, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  themeBtnTxt: { fontSize: font.xs, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: font.sm, fontWeight: '500' },
  menuValue: { fontSize: font.sm },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, margin: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  logoutTxt: { fontWeight: '700', fontSize: font.md },
  footer: { fontSize: font.xs, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
});
