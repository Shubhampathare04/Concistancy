import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/store/ThemeContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { professionalsApi } from '@/features/tasks/api';
import { font, spacing, radius } from '@/constants/theme';

export default function ProfessionalsScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showBook, setShowBook]     = useState<number | null>(null);
  const [bookDate, setBookDate]     = useState('');
  const [bookNotes, setBookNotes]   = useState('');

  const { data: pros = [], refetch } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => (await professionalsApi.list()).data,
    staleTime: 1000 * 60 * 5,
  });

  const { data: myConsultations = [] } = useQuery({
    queryKey: ['my-consultations'],
    queryFn: async () => (await professionalsApi.myConsultations()).data,
    staleTime: 1000 * 60 * 2,
  });

  const { mutate: book, isPending: booking } = useMutation({
    mutationFn: () => professionalsApi.book({
      professional_id: showBook,
      scheduled_at: new Date(bookDate).toISOString(),
      notes: bookNotes || undefined,
    }),
    onSuccess: () => {
      Alert.alert('Booked!', 'Your consultation has been scheduled.');
      setShowBook(null); setBookDate(''); setBookNotes('');
      qc.invalidateQueries({ queryKey: ['my-consultations'] });
    },
    onError: () => Alert.alert('Error', 'Failed to book. Please try again.'),
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={[s.pageTitle, { color: colors.text }]}>Professionals</Text>

        {/* My Consultations */}
        {myConsultations.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: colors.textMuted }]}>MY CONSULTATIONS</Text>
            {myConsultations.map((c: any) => (
              <View key={c.id} style={[s.consultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.statusDot, { backgroundColor: c.status === 'confirmed' ? colors.green : c.status === 'pending' ? colors.yellow : colors.textDim }]} />
                <View style={s.consultBody}>
                  <Text style={[s.consultDate, { color: colors.text }]}>
                    {new Date(c.scheduled_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[s.consultStatus, { color: colors.textMuted }]}>{c.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={[s.sectionLabel, { color: colors.textMuted }]}>VERIFIED PROFESSIONALS</Text>

        {pros.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-circle-outline" size={44} color={colors.textDim} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No professionals yet</Text>
            <Text style={[s.emptySub, { color: colors.textMuted }]}>Verified coaches will appear here</Text>
          </View>
        ) : (
          pros.map((pro: any) => (
            <View key={pro.id} style={[s.proCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={[colors.blue + '10', colors.blue + '04']} style={StyleSheet.absoluteFill} />
              <View style={[s.proAvatar, { backgroundColor: colors.blue + '20' }]}>
                <Text style={[s.proAvatarTxt, { color: colors.blue }]}>{pro.name?.[0]?.toUpperCase() ?? 'P'}</Text>
              </View>
              <View style={s.proBody}>
                <View style={s.proNameRow}>
                  <Text style={[s.proName, { color: colors.text }]}>{pro.name ?? 'Professional'}</Text>
                  {pro.is_verified && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.blue} />
                  )}
                </View>
                <Text style={[s.proSpecialty, { color: colors.blue }]}>{pro.specialty}</Text>
                {pro.bio ? (
                  <Text style={[s.proBio, { color: colors.textSub }]} numberOfLines={2}>{pro.bio}</Text>
                ) : null}
                <View style={s.proFooter}>
                  {pro.hourly_rate > 0 && (
                    <Text style={[s.proRate, { color: colors.yellow }]}>${pro.hourly_rate}/hr</Text>
                  )}
                  <TouchableOpacity
                    style={[s.bookBtn, { backgroundColor: colors.blue }]}
                    onPress={() => setShowBook(pro.id)}
                  >
                    <Ionicons name="calendar-outline" size={13} color="#fff" />
                    <Text style={s.bookBtnTxt}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Book Modal inline */}
        {showBook != null && (
          <View style={[s.bookForm, { backgroundColor: colors.card, borderColor: colors.blue + '40' }]}>
            <Text style={[s.bookTitle, { color: colors.text }]}>Schedule Consultation</Text>
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Date & time (e.g. 2026-06-15 10:00)"
              placeholderTextColor={colors.textMuted}
              value={bookDate}
              onChangeText={setBookDate}
            />
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, height: 80, textAlignVertical: 'top' }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={bookNotes}
              onChangeText={setBookNotes}
              multiline
            />
            <View style={s.bookActions}>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowBook(null)}>
                <Text style={[s.cancelTxt, { color: colors.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: colors.blue, opacity: !bookDate || booking ? 0.5 : 1 }]}
                onPress={() => bookDate && book()}
                disabled={!bookDate || booking}
              >
                <Text style={s.confirmTxt}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  pageTitle:    { fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.md },
  sectionLabel: { fontSize: font.xs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.sm },

  consultCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: radius.xl, padding: spacing.md, marginBottom: 8, borderWidth: 1, gap: 12 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  consultBody:  { flex: 1 },
  consultDate:  { fontSize: font.sm, fontWeight: '600' },
  consultStatus: { fontSize: font.xs, textTransform: 'capitalize', marginTop: 2 },

  empty:      { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyTitle: { fontSize: font.xl, fontWeight: '800' },
  emptySub:   { fontSize: font.sm, textAlign: 'center' },

  proCard:      { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, overflow: 'hidden', flexDirection: 'row', gap: 12 },
  proAvatar:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  proAvatarTxt: { fontSize: font.xl, fontWeight: '900' },
  proBody:      { flex: 1, gap: 4 },
  proNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proName:      { fontSize: font.md, fontWeight: '800' },
  proSpecialty: { fontSize: font.sm, fontWeight: '600' },
  proBio:       { fontSize: font.xs, lineHeight: 16 },
  proFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  proRate:      { fontSize: font.sm, fontWeight: '700' },
  bookBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full },
  bookBtnTxt:   { color: '#fff', fontWeight: '800', fontSize: font.sm },

  bookForm:    { borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, gap: 10, marginTop: spacing.md },
  bookTitle:   { fontSize: font.lg, fontWeight: '800', marginBottom: 4 },
  input:       { borderWidth: 1, borderRadius: radius.md, padding: 12, fontSize: font.sm },
  bookActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:   { flex: 1, padding: 13, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1 },
  cancelTxt:   { fontWeight: '700', fontSize: font.sm },
  confirmBtn:  { flex: 1, padding: 13, borderRadius: radius.lg, alignItems: 'center' },
  confirmTxt:  { color: '#fff', fontWeight: '800', fontSize: font.sm },
});
