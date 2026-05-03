import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { subscriptionsApi } from '@/features/tasks/api';
import { useDashboard } from '@/features/tasks/hooks/useTasks';
import { font, spacing, radius, gradients } from '@/constants/theme';

const PLANS = [
  {
    key: 'free',
    label: 'Free',
    price: '0',
    color: '#60a5fa',
    features: ['Basic task tracking', 'Streak & XP system', 'Offline support', 'Dark/Light theme'],
    missing: ['AI suggestions', 'Streak freeze', 'Events & Challenges', 'Professionals'],
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '200 coins',
    color: '#fbbf24',
    features: ['Everything in Free', 'AI task suggestions', '3 streak freezes/month', 'Events & Challenges', 'Weekly AI report'],
    missing: ['Professionals consulting'],
  },
  {
    key: 'elite',
    label: 'Elite',
    price: '500 coins',
    color: '#a78bfa',
    features: ['Everything in Pro', 'Professionals consulting', 'Priority AI insights', 'Unlimited streak freezes', 'Badge showcase'],
    missing: [],
  },
];

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { data: dashboard } = useDashboard();

  const { data: sub, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await subscriptionsApi.status()).data,
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: subscribe, isPending: subscribing } = useMutation({
    mutationFn: (plan: string) => subscriptionsApi.subscribe(plan),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      Alert.alert('Subscribed!', 'Your plan has been activated.');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.detail ?? 'Insufficient coins'),
  });

  const { mutate: renew } = useMutation({
    mutationFn: () => subscriptionsApi.renew(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      Alert.alert('Renewed!', 'Your subscription has been extended.');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to renew'),
  });

  const { mutate: freeze } = useMutation({
    mutationFn: () => subscriptionsApi.freezeStreak(),
    onSuccess: (data: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      qc.invalidateQueries({ queryKey: ['subscription'] });
      Alert.alert('Streak Frozen!', `${data.data?.freezes_remaining ?? 0} freezes remaining.`);
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.detail ?? 'No freezes available'),
  });

  const coins   = dashboard?.coins ?? 0;
  const streak  = dashboard?.streak ?? 0;
  const hasDiscount = streak >= 7;
  const currentPlan = sub?.plan ?? 'free';

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[s.pageTitle, { color: colors.text }]}>Subscription</Text>

        {/* Current Status */}
        <View style={[s.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.statusLeft}>
            <Text style={[s.statusLabel, { color: colors.textMuted }]}>CURRENT PLAN</Text>
            <Text style={[s.statusPlan, { color: colors.primary }]}>{currentPlan.toUpperCase()}</Text>
            {sub?.expires_at && (
              <Text style={[s.statusExpiry, { color: colors.textMuted }]}>
                Expires {new Date(sub.expires_at).toLocaleDateString()}
              </Text>
            )}
          </View>
          <View style={s.statusRight}>
            <View style={[s.coinsBadge, { backgroundColor: colors.yellow + '14', borderColor: colors.yellow + '30' }]}>
              <Ionicons name="diamond" size={14} color={colors.yellow} />
              <Text style={[s.coinsVal, { color: colors.yellow }]}>{coins}</Text>
            </View>
            {currentPlan !== 'free' && (
              <TouchableOpacity
                style={[s.renewBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => renew()}
              >
                <Text style={[s.renewTxt, { color: colors.textSub }]}>Renew</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Streak Discount Banner */}
        {hasDiscount && (
          <View style={[s.discountBanner, { backgroundColor: colors.green + '12', borderColor: colors.green + '30' }]}>
            <Ionicons name="flame" size={16} color={colors.green} />
            <Text style={[s.discountTxt, { color: colors.green }]}>
              {streak}-day streak active — 20% coin discount on all plans!
            </Text>
          </View>
        )}

        {/* Streak Freeze */}
        {currentPlan !== 'free' && (
          <TouchableOpacity
            style={[s.freezeBtn, { backgroundColor: colors.blue + '12', borderColor: colors.blue + '30' }]}
            onPress={() => Alert.alert(
              'Use Streak Freeze?',
              `You have ${sub?.streak_freeze_count ?? 0} freeze(s) left. This will protect your streak for today.`,
              [{ text: 'Cancel', style: 'cancel' }, { text: 'Freeze', onPress: () => freeze() }]
            )}
          >
            <Ionicons name="snow-outline" size={18} color={colors.blue} />
            <Text style={[s.freezeTxt, { color: colors.blue }]}>
              Use Streak Freeze ({sub?.streak_freeze_count ?? 0} left)
            </Text>
          </TouchableOpacity>
        )}

        {/* Plan Cards */}
        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>PLANS</Text>
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.key;
          const cost = plan.key !== 'free'
            ? (hasDiscount ? Math.floor(parseInt(plan.price) * 0.8) : parseInt(plan.price))
            : 0;
          return (
            <View key={plan.key} style={[s.planCard, {
              backgroundColor: colors.card,
              borderColor: isCurrent ? plan.color + '60' : colors.border,
              borderWidth: isCurrent ? 2 : 1,
            }]}>
              <LinearGradient colors={[plan.color + '10', plan.color + '04']} style={StyleSheet.absoluteFill} />
              <View style={s.planHeader}>
                <Text style={[s.planName, { color: plan.color }]}>{plan.label}</Text>
                {isCurrent && (
                  <View style={[s.currentPill, { backgroundColor: plan.color + '20', borderColor: plan.color + '40' }]}>
                    <Text style={[s.currentTxt, { color: plan.color }]}>Current</Text>
                  </View>
                )}
                <Text style={[s.planPrice, { color: colors.text }]}>
                  {plan.key === 'free' ? 'Free' : `${cost} coins`}
                  {hasDiscount && plan.key !== 'free' && ' '}
                </Text>
                {hasDiscount && plan.key !== 'free' && <Ionicons name="flame" size={14} color={colors.primary} />}
              </View>
              {plan.features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                  <Text style={[s.featureTxt, { color: colors.textSub }]}>{f}</Text>
                </View>
              ))}
              {plan.missing.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="close-circle-outline" size={14} color={colors.textDim} />
                  <Text style={[s.featureTxt, { color: colors.textDim }]}>{f}</Text>
                </View>
              ))}
              {!isCurrent && plan.key !== 'free' && (
                <TouchableOpacity
                  style={[s.subscribeBtn, { backgroundColor: plan.color, opacity: subscribing ? 0.6 : 1 }]}
                  onPress={() => Alert.alert(
                    `Subscribe to ${plan.label}?`,
                    `This costs ${cost} coins. You have ${coins} coins.`,
                    [{ text: 'Cancel', style: 'cancel' }, { text: 'Subscribe', onPress: () => subscribe(plan.key) }]
                  )}
                  disabled={subscribing}
                >
                  <Text style={s.subscribeTxt}>Get {plan.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.md },

  statusCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  statusLeft:   { gap: 2 },
  statusLabel:  { fontSize: font.xs, fontWeight: '700', letterSpacing: 1 },
  statusPlan:   { fontSize: font.xxl, fontWeight: '900', letterSpacing: -0.5 },
  statusExpiry: { fontSize: font.xs },
  statusRight:  { alignItems: 'flex-end', gap: 8 },
  coinsBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  coinsVal:     { fontSize: font.md, fontWeight: '900' },
  renewBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  renewTxt:     { fontSize: font.xs, fontWeight: '700' },

  discountBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, marginBottom: spacing.md },
  discountTxt:    { fontSize: font.sm, fontWeight: '600', flex: 1 },

  freezeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, marginBottom: spacing.md },
  freezeTxt: { fontSize: font.sm, fontWeight: '700' },

  sectionLabel: { fontSize: font.xs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },

  planCard:    { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden', gap: 6 },
  planHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planName:    { fontSize: font.xl, fontWeight: '900', flex: 1 },
  currentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  currentTxt:  { fontSize: font.xs, fontWeight: '800' },
  planPrice:   { fontSize: font.sm, fontWeight: '700' },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureTxt:  { fontSize: font.sm },
  subscribeBtn: { marginTop: 8, padding: 14, borderRadius: radius.lg, alignItems: 'center' },
  subscribeTxt: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
