import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, StatusBar, Animated, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboard, useRank, useWeeklyReport } from '@/features/tasks/hooks/useTasks';
import { useTheme } from '@/store/ThemeContext';
import type { ThemeMode } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import AnimatedBadge from '../components/AnimatedBadge';
import { font, spacing, radius, gradients, shadow } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 120;

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light',  label: 'Light',  icon: 'sunny-outline'          },
  { mode: 'dark',   label: 'Dark',   icon: 'moon-outline'           },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const COIN_TIER_COLORS: Record<string, string> = {
  bronze:  '#cd7f32',
  silver:  '#c0c0c0',
  gold:    '#fbbf24',
  diamond: '#60a5fa',
  legend:  '#a78bfa',
};

const BADGE_ICONS: Record<string, string> = {
  first_task:    'flag',
  streak_3:      'leaf',
  streak_7:      'flame',
  streak_14:     'trending-up',
  streak_30:     'diamond',
  level_5:       'star',
  level_10:      'trophy',
  xp_500:        'flash',
  xp_1000:       'flash',
  ci_80:         'shield-checkmark',
  silver_coins:  'shield-half',
  gold_coins:    'shield',
  diamond_coins: 'diamond',
};

const BADGE_COLORS: Record<string, string> = {
  first_task:    '#34d399',
  streak_3:      '#10b981',
  streak_7:      '#ff6b35',
  streak_14:     '#ef4444',
  streak_30:     '#a78bfa',
  level_5:       '#fbbf24',
  level_10:      '#f59e0b',
  xp_500:        '#60a5fa',
  xp_1000:       '#3b82f6',
  ci_80:         '#8b5cf6',
  silver_coins:  '#c0c0c0',
  gold_coins:    '#fbbf24',
  diamond_coins: '#60a5fa',
};

export default function ProfileScreen() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const nav    = useNavigation<any>();
  const { data }         = useDashboard();
  const { data: rank }   = useRank();
  const { data: report } = useWeeklyReport();
  const { colors, mode, setMode, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled]                 = useState(true);
  const [dailyReminder, setDailyReminder]               = useState(true);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    // FAB pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const level  = data?.level ?? 1;
  const xp     = data?.xp ?? 0;
  const streak = data?.streak ?? 0;
  const coins  = data?.coins ?? 0;

  const rankTitle  = rank?.rank_title ?? 'Beginner';
  const coinTier   = rank?.coin_tier;
  const badges     = rank?.badges ?? [];
  const tierColor  = coinTier ? (COIN_TIER_COLORS[coinTier.tier] ?? colors.primary) : colors.primary;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={13} color={colors.textMuted} />
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
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text style={[s.menuLabel, { color: colors.text }]}>{label}</Text>
      {rightEl ?? (
        value ? <Text style={[s.menuValue, { color: colors.textMuted }]}>{value}</Text>
          : onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textDim} /> : null
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Animated Header */}
      <Animated.View style={[s.headerContainer, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <LinearGradient
          colors={coinTier ? [tierColor + '40', tierColor + '10', colors.bg] : [colors.primary + '40', colors.primary + '10', colors.bg]}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.headerContent}>
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <SyncStatusBadge />
          </View>
          
          <Animated.View style={[s.avatarSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={coinTier ? [tierColor, tierColor + '80'] : gradients.primary} style={s.avatarRing}>
              <View style={[s.avatar, { backgroundColor: colors.card }]}>
                <Text style={[s.avatarTxt, { color: tierColor }]}>
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            </LinearGradient>
            <Text style={[s.userName, { color: colors.text }]}>{user?.name ?? 'User'}</Text>
            <Text style={[s.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
            <View style={s.titleRow}>
              <View style={[s.titleBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder }]}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={[s.titleBadgeTxt, { color: colors.primary }]}>{rankTitle}</Text>
              </View>
              {coinTier && (
                <View style={[s.titleBadge, { backgroundColor: tierColor + '18', borderColor: tierColor + '40' }]}>
                  <Ionicons name={coinTier.icon as any} size={12} color={tierColor} />
                  <Text style={[s.titleBadgeTxt, { color: tierColor }]}>{coinTier.label}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT, paddingBottom: 100, paddingHorizontal: spacing.md }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >

        {/* ── Identity / North star ── */}
        <View style={[s.northCard, { backgroundColor: colors.card, borderColor: colors.primaryBorder }]}>
          <LinearGradient colors={[colors.primary + '20', colors.secondary + '12']} style={StyleSheet.absoluteFill} />
          <View style={s.northRow}>
            <View style={[s.northIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="compass-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.northKicker, { color: colors.primary }]}>IDENTITY</Text>
              <Text style={[s.northTitle, { color: colors.text }]}>You are building proof, not plans.</Text>
              <Text style={[s.northBody, { color: colors.textMuted }]}>
                Every mission is a vote for the person you are becoming. Streaks and XP are the receipts.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stats Grid ── */}
        <View style={s.statsGrid}>
          {[
            { label: 'Streak', value: streak, color: colors.primary, icon: 'flame', gradient: gradients.streak },
            { label: 'XP', value: xp, color: colors.yellow, icon: 'flash', gradient: gradients.xp },
            { label: 'Level', value: level, color: colors.purple, icon: 'shield-checkmark', gradient: gradients.purple },
            { label: 'Coins', value: coins, color: tierColor, icon: 'diamond', gradient: [tierColor, tierColor + '80'] },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
              <LinearGradient colors={[item.color + '18', item.color + '08']} style={StyleSheet.absoluteFill} />
              <View style={[s.statIconWrap, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLbl, { color: colors.textMuted }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.quickActions}>
          {[
            { icon: 'trophy', label: 'Leaderboard', color: colors.yellow, screen: 'Social' },
            { icon: 'calendar', label: 'Events', color: colors.blue, screen: 'Events' },
            { icon: 'people', label: 'Community', color: colors.green, screen: 'Social' },
            { icon: 'diamond', label: 'Premium', color: colors.purple, screen: 'Subscription' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[s.quickActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => nav.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient colors={[action.color + '12', action.color + '05']} style={StyleSheet.absoluteFill} />
              <View style={[s.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={18} color={action.color} />
              </View>
              <Text style={[s.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Coin Tier Progress ── */}
        {coinTier && coinTier.coins_to_next != null && (
          <TouchableOpacity
            style={[s.tierCard, { backgroundColor: colors.card, borderColor: tierColor + '30' }]}
            activeOpacity={0.9}
            onPress={() => Alert.alert('Tier Progress', `You're ${coinTier.coins_to_next} coins away from ${coinTier.next_tier} tier!`)}
          >
            <LinearGradient colors={[tierColor + '18', tierColor + '06']} style={StyleSheet.absoluteFill} />
            <View style={s.tierHeader}>
              <View style={s.tierLeft}>
                <View style={[s.tierIconWrap, { backgroundColor: tierColor + '25' }]}>
                  <Ionicons name={coinTier.icon as any} size={26} color={tierColor} />
                </View>
                <View>
                  <Text style={[s.tierLabel, { color: tierColor }]}>{coinTier.label} Tier</Text>
                  <Text style={[s.tierSub, { color: colors.textMuted }]}>
                    {coinTier.coins_to_next} to {coinTier.next_tier}
                  </Text>
                </View>
              </View>
              <View style={s.tierRight}>
                <Text style={[s.tierProgress, { color: tierColor }]}>
                  {Math.min(Math.round(((coins % 500) / 500) * 100), 100)}%
                </Text>
              </View>
            </View>
            <View style={[s.tierTrack, { backgroundColor: colors.surface }]}>
              <Animated.View
                style={[s.tierFill, {
                  backgroundColor: tierColor,
                  width: `${Math.min(((coins % 500) / 500) * 100, 100)}%`,
                }]}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Weekly Report ── */}
        {report && (
          <TouchableOpacity
            style={[s.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => Alert.alert('Weekly Report', report.top_insight || 'Keep up the great work!')}
          >
            <LinearGradient
              colors={[colors.blue + '08', colors.blue + '02']}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.reportHeader}>
              <View style={[s.reportIcon, { backgroundColor: colors.blue + '20' }]}>
                <Ionicons name="bar-chart" size={16} color={colors.blue} />
              </View>
              <Text style={[s.reportTitle, { color: colors.text }]}>Last Week Performance</Text>
            </View>
            <Text style={[s.reportDate, { color: colors.textMuted }]}>{report.week_start}</Text>
            <View style={s.reportStats}>
              {[
                { label: 'Tasks', value: report.completions, color: colors.green,  icon: 'checkmark-circle' },
                { label: 'XP',    value: report.xp_earned,  color: colors.yellow, icon: 'flash'            },
                { label: 'CI',    value: `${report.consistency_index.toFixed(0)}`, color: colors.blue, icon: 'analytics' },
              ].map((item, i) => (
                <View key={i} style={[s.reportStat, { backgroundColor: colors.surface, borderColor: item.color + '20' }]}>
                  <View style={[s.reportStatIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={[s.reportStatVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={[s.reportStatLbl, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </View>
            {report.top_insight && (
              <View style={[s.insightBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="bulb" size={14} color={colors.yellow} />
                <Text style={[s.reportInsight, { color: colors.textSub }]}>{report.top_insight}</Text>
              </View>
            )}
            {report.improvement_tip && (
              <View style={s.tipRow}>
                <Ionicons name="trending-up" size={14} color={colors.blue} />
                <Text style={[s.reportTip, { color: colors.blue }]}>{report.improvement_tip}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <>
            <SectionHeader icon="ribbon-outline" title="ACHIEVEMENTS" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.badgeScroll}
            >
              {badges.map((key: string, idx: number) => (
                <AnimatedBadge
                  key={key}
                  icon={BADGE_ICONS[key] ?? 'star'}
                  label={key.replace(/_/g, ' ')}
                  color={BADGE_COLORS[key] ?? colors.yellow}
                  delay={idx * 80}
                  onPress={() => Alert.alert('Achievement', `You earned: ${key.replace(/_/g, ' ')}`)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Appearance ── */}
        <SectionHeader icon="color-palette-outline" title="APPEARANCE" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.themeLabel, { color: colors.textMuted }]}>Theme</Text>
          <View style={s.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    s.themeBtn,
                    { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border },
                    active && { backgroundColor: colors.primaryDim },
                  ]}
                  onPress={() => setMode(opt.mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon as any} size={22} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[s.themeBtnTxt, { color: active ? colors.primary : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[s.themeCheck, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Notifications ── */}
        <SectionHeader icon="notifications-outline" title="NOTIFICATIONS" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="notifications-outline" iconColor={colors.blue} label="Push Notifications"
            rightEl={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
          <MenuItem icon="volume-medium-outline" iconColor={colors.green} label="Sound"
            rightEl={<Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
          <MenuItem icon="alarm-outline" iconColor={colors.yellow} label="Daily Reminder"
            rightEl={<Switch value={dailyReminder} onValueChange={setDailyReminder} trackColor={{ true: colors.primary }} thumbColor="#fff" />} />
        </View>

        {/* ── Account ── */}
        <SectionHeader icon="person-outline" title="ACCOUNT" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="person-outline"           iconColor={colors.purple} label="Name"           value={user?.name ?? '—'} />
          <MenuItem icon="mail-outline"             iconColor={colors.blue}   label="Email"          value={user?.email ?? '—'} />
          <MenuItem icon="shield-checkmark-outline" iconColor={colors.green}  label="Account Status" value="Active" />
          <MenuItem icon="key-outline"              iconColor={colors.yellow} label="Change Password"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available in the next update.')} />
        </View>

        {/* ── App Info ── */}
        <SectionHeader icon="information-circle-outline" title="APP" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="leaf-outline"          iconColor={colors.green}   label="Habits"          onPress={() => nav.navigate('Habits')} />
          <MenuItem icon="trophy-outline"        iconColor={colors.yellow}  label="Events"          onPress={() => nav.navigate('Events')} />
          <MenuItem icon="people-outline"        iconColor={colors.blue}    label="Social"          onPress={() => nav.navigate('Social')} />
          <MenuItem icon="people-circle-outline" iconColor={colors.purple}  label="Professionals"   onPress={() => nav.navigate('Professionals')} />
          <MenuItem icon="diamond-outline"       iconColor={colors.primary} label="Subscription"    onPress={() => nav.navigate('Subscription')} />
        </View>

        {/* ── App Info ── */}
        <SectionHeader icon="information-circle-outline" title="APP INFO" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="code-slash-outline"    iconColor={colors.textMuted} label="Version"       value="2.0.0" />
          <MenuItem icon="hardware-chip-outline" iconColor={colors.textMuted} label="AI Engine"     value="Rule-based v2" />
          <MenuItem icon="cloud-offline-outline" iconColor={colors.green}     label="Offline Mode"  value="Enabled" />
          <MenuItem icon="server-outline"        iconColor={colors.textMuted} label="Backend"       value="FastAPI" />
          <MenuItem icon="document-text-outline" iconColor={colors.blue}      label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally and on your private server.')} />
          <MenuItem icon="help-circle-outline"   iconColor={colors.yellow}    label="Help & Support"
            onPress={() => Alert.alert('Support', 'Contact: support@consistency.app')} />
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader icon="warning-outline" title="DANGER ZONE" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem icon="trash-outline" iconColor={colors.red} label="Clear All Data"
            onPress={() => Alert.alert('Clear Data', 'This will delete all your local data. Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => {} },
            ])} />
          <TouchableOpacity
            style={[s.logoutBtn, { backgroundColor: colors.redDim, borderColor: colors.red + '40' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={[s.logoutTxt, { color: colors.red }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.footer, { color: colors.textDim }]}>Consistency App • Made for champions</Text>
      </Animated.ScrollView>

      {/* Floating Edit Button */}
      <Animated.View style={{ transform: [{ scale: fabPulse }] }}>
        <TouchableOpacity
          style={[s.fab, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
          activeOpacity={0.9}
        >
          <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    zIndex: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
  },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg },
  avatarRing: { width: 110, height: 110, borderRadius: 55, padding: 3, marginBottom: spacing.md, ...shadow.lg },
  avatar: { flex: 1, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  userName: { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5 },
  userEmail: { fontSize: font.sm, marginTop: 4, opacity: 0.7 },
  titleRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  titleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, ...shadow.sm },
  titleBadgeTxt: { fontSize: font.sm, fontWeight: '800', letterSpacing: 0.3 },

  northCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  northRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  northIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  northKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  northTitle: { fontSize: font.lg, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
  northBody: { fontSize: font.sm, lineHeight: 20, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, minWidth: (SCREEN_WIDTH - spacing.md * 3) / 2, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, alignItems: 'center', gap: 8, overflow: 'hidden', ...shadow.sm },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: font.hero, fontWeight: '900', letterSpacing: -1 },
  statLbl: { fontSize: font.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  quickActions: { gap: spacing.sm, marginBottom: spacing.md },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', ...shadow.xs },
  quickActionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { flex: 1, fontSize: font.md, fontWeight: '700', letterSpacing: -0.2 },

  tierCard:  { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1.5, overflow: 'hidden', gap: 12, ...shadow.sm },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  tierLabel: { fontSize: font.lg, fontWeight: '900', letterSpacing: -0.3 },
  tierSub:   { fontSize: font.xs, marginTop: 2, fontWeight: '600' },
  tierRight: { alignItems: 'flex-end' },
  tierProgress: { fontSize: font.xxl, fontWeight: '900', letterSpacing: -1 },
  tierTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  tierFill:  { height: '100%', borderRadius: 4 },

  reportCard:   { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1.5, gap: 12, overflow: 'hidden', ...shadow.sm },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reportIcon:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportTitle:  { fontSize: font.lg, fontWeight: '800', flex: 1, letterSpacing: -0.3 },
  reportDate:   { fontSize: font.xs, color: '#888', fontWeight: '600', marginBottom: 4 },
  reportStats:  { flexDirection: 'row', gap: 10 },
  reportStat:   { flex: 1, borderRadius: radius.lg, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 6, ...shadow.xs },
  reportStatIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reportStatVal: { fontSize: font.xl, fontWeight: '900', letterSpacing: -0.5 },
  reportStatLbl: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightBox: { flexDirection: 'row', gap: 8, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  reportInsight: { fontSize: font.sm, lineHeight: 20, flex: 1, fontWeight: '500' },
  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  reportTip:    { fontSize: font.sm, fontWeight: '700', flex: 1 },

  badgeScroll: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },

  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, marginTop: spacing.md, paddingHorizontal: 4 },
  sectionHeaderTxt: { fontSize: font.xs, fontWeight: '700', letterSpacing: 1 },

  card:       { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.sm, ...shadow.xs },
  themeLabel: { fontSize: font.xs, fontWeight: '600', paddingHorizontal: spacing.md, paddingTop: spacing.md, marginBottom: spacing.sm },
  themeRow:   { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
  themeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1.5, position: 'relative',
  },
  themeBtnTxt: { fontSize: font.sm, fontWeight: '700' },
  themeCheck:  { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  menuIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { flex: 1, fontSize: font.sm, fontWeight: '500' },
  menuValue:   { fontSize: font.sm },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, margin: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  logoutTxt: { fontWeight: '700', fontSize: font.md },
  footer:    { fontSize: font.xs, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.lg,
  },
});
