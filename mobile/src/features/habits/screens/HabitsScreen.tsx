import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { habitsApi } from '@/features/tasks/api';
import { font, spacing, radius, gradients } from '@/constants/theme';

const CATEGORIES = [
  { value: 'health',   label: 'Health',   icon: 'heart-outline',    color: '#f87171' },
  { value: 'fitness',  label: 'Fitness',  icon: 'barbell-outline',  color: '#f97316' },
  { value: 'mental',   label: 'Mental',   icon: 'brain',            color: '#a78bfa' },
  { value: 'diet',     label: 'Diet',     icon: 'nutrition-outline',color: '#34d399' },
  { value: 'other',    label: 'Other',    icon: 'ellipsis-horizontal-outline', color: '#60a5fa' },
];

const AI_TIPS = [
  "Drink 8 glasses of water daily to boost energy and focus.",
  "A 10-minute morning walk improves mood for the entire day.",
  "Consistent sleep schedule is the #1 habit for performance.",
  "Meditation for 5 minutes reduces cortisol by up to 20%.",
  "Eating protein at breakfast reduces cravings throughout the day.",
];

function getCategoryMeta(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[4];
}

export default function HabitsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle]           = useState('');
  const [category, setCategory]     = useState('health');
  const [aiTip]                     = useState(() => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);

  const { data: habits = [], refetch } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => (await habitsApi.list()).data,
    staleTime: 1000 * 60,
  });

  const { mutate: createHabit, isPending: creating } = useMutation({
    mutationFn: () => habitsApi.create({ title: title.trim(), category }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      setTitle(''); setShowCreate(false);
    },
  });

  const { mutate: logHabit } = useMutation({
    mutationFn: (id: number) => habitsApi.log(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const { mutate: deleteHabit } = useMutation({
    mutationFn: (id: number) => habitsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={s.header}>
          <Text style={[s.pageTitle, { color: colors.text }]}>Habits</Text>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreate(v => !v)}
          >
            <Ionicons name={showCreate ? 'close' : 'add'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── AI Doctor Card ── */}
        <View style={[s.aiCard, { backgroundColor: colors.card, borderColor: colors.purple + '40' }]}>
          <LinearGradient colors={['#a78bfa12', '#a78bfa04']} style={StyleSheet.absoluteFill} />
          <View style={[s.aiIcon, { backgroundColor: colors.purple + '20' }]}>
            <Ionicons name="medical" size={18} color={colors.purple} />
          </View>
          <View style={s.aiBody}>
            <Text style={[s.aiLabel, { color: colors.purple }]}>AI Doctor</Text>
            <Text style={[s.aiTip, { color: colors.textSub }]}>{aiTip}</Text>
          </View>
        </View>

        {/* ── Create Form ── */}
        {showCreate && (
          <View style={[s.createCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Habit title..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    style={[s.catChip, {
                      backgroundColor: category === c.value ? c.color + '20' : colors.surface,
                      borderColor: category === c.value ? c.color + '60' : colors.border,
                    }]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Ionicons name={c.icon as any} size={13} color={category === c.value ? c.color : colors.textMuted} />
                    <Text style={[s.catTxt, { color: category === c.value ? c.color : colors.textMuted }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: colors.primary, opacity: !title.trim() || creating ? 0.5 : 1 }]}
              onPress={() => title.trim() && createHabit()}
              disabled={!title.trim() || creating}
            >
              <Text style={s.createBtnTxt}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Habits List ── */}
        {habits.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="leaf-outline" size={44} color={colors.textDim} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No habits yet</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>Add your first habit to start tracking</Text>
          </View>
        ) : (
          habits.map((habit: any) => {
            const meta = getCategoryMeta(habit.category);
            return (
              <View key={habit.id} style={[s.habitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.habitAccent, { backgroundColor: meta.color }]} />
                <View style={[s.habitIcon, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={s.habitBody}>
                  <Text style={[s.habitTitle, { color: colors.text }]}>{habit.title}</Text>
                  <View style={s.habitMeta}>
                    <View style={[s.catPill, { backgroundColor: meta.color + '14' }]}>
                      <Text style={[s.catPillTxt, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={[s.habitFreq, { color: colors.textMuted }]}>{habit.frequency}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.logBtn, { backgroundColor: meta.color + '18', borderColor: meta.color + '40' }]}
                  onPress={() => logHabit(habit.id)}
                >
                  <Ionicons name="checkmark" size={18} color={meta.color} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => Alert.alert('Delete', `Delete "${habit.title}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
                  ])}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textDim} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  pageTitle: { fontSize: font.xxl, fontWeight: '800' },
  addBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  aiCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  aiIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiBody:  { flex: 1 },
  aiLabel: { fontSize: font.xs, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  aiTip:   { fontSize: font.sm, lineHeight: 18 },

  createCard: { borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, marginBottom: spacing.md, gap: 10 },
  input:      { borderWidth: 1, borderRadius: radius.md, padding: 12, fontSize: font.md },
  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  catTxt:     { fontSize: font.xs, fontWeight: '700' },
  createBtn:  { padding: 14, borderRadius: radius.lg, alignItems: 'center' },
  createBtnTxt: { color: '#fff', fontWeight: '800', fontSize: font.md },

  empty:      { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: font.xl, fontWeight: '800' },
  emptySub:   { fontSize: font.sm, textAlign: 'center' },

  habitCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  habitAccent: { width: 4, alignSelf: 'stretch' },
  habitIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', margin: 12 },
  habitBody:   { flex: 1, paddingVertical: 12 },
  habitTitle:  { fontSize: font.md, fontWeight: '700', marginBottom: 4 },
  habitMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  catPillTxt:  { fontSize: font.xs, fontWeight: '700' },
  habitFreq:   { fontSize: font.xs, textTransform: 'capitalize' },
  logBtn:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 8 },
  deleteBtn:   { padding: 10, marginRight: 4 },
});
