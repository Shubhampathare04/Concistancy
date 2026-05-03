import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../store/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';

const UNITS = ['steps', 'minutes', 'reps', 'glasses', 'km', 'custom'];

export default function CreateGroupChallengeScreen({ route }: any) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('steps');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [rewardCoins, setRewardCoins] = useState('100');

  const createMutation = useMutation({
    mutationFn: (data: any) => groupsApi.createChallenge(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId, 'challenges'] });
      navigation.goBack();
    },
  });

  const handleCreate = () => {
    if (!title.trim() || !targetValue) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      target_value: parseInt(targetValue),
      target_unit: targetUnit,
      start_date: startDate,
      end_date: endDate,
      reward_coins: parseInt(rewardCoins),
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.label, { color: colors.text }]}>Challenge Title</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. 10,000 steps daily"
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="What's the goal?"
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.label, { color: colors.text }]}>Target Value</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. 10000"
        placeholderTextColor={colors.textSecondary}
        value={targetValue}
        onChangeText={setTargetValue}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
      <View style={styles.unitsRow}>
        {UNITS.map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[styles.unitBtn, targetUnit === unit && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
            onPress={() => setTargetUnit(unit)}
          >
            <Text style={[styles.unitText, { color: targetUnit === unit ? '#fff' : colors.text }]}>{unit}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={startDate}
        onChangeText={setStartDate}
      />

      <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={endDate}
        onChangeText={setEndDate}
      />

      <Text style={[styles.label, { color: colors.text }]}>Reward Coins</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="100"
        placeholderTextColor={colors.textSecondary}
        value={rewardCoins}
        onChangeText={setRewardCoins}
        keyboardType="numeric"
      />

      <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>Preview</Text>
        <Text style={[styles.previewChallengeTitle, { color: colors.text }]}>{title || 'Challenge Title'}</Text>
        <Text style={[styles.previewDesc, { color: colors.textSecondary }]}>{description || 'Description'}</Text>
        <Text style={[styles.previewTarget, { color: colors.primary }]}>
          Target: {targetValue || '0'} {targetUnit}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.previewReward, { color: colors.textSecondary }]}>Reward:</Text>
          <Ionicons name="diamond" size={14} color={colors.yellow} />
          <Text style={[styles.previewReward, { color: colors.textSecondary }]}>{rewardCoins} coins</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: colors.primary }]}
        onPress={handleCreate}
        disabled={createMutation.isPending}
      >
        <Text style={styles.createText}>{createMutation.isPending ? 'Creating...' : 'Create Challenge'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1 },
  textArea: { height: 80, textAlignVertical: 'top' },
  unitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  unitText: { fontSize: 14, fontWeight: '600' },
  previewCard: { padding: 16, borderRadius: 12, marginTop: 8 },
  previewTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  previewChallengeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  previewDesc: { fontSize: 14, marginBottom: 8 },
  previewTarget: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  previewReward: { fontSize: 14 },
  createBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  createText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
