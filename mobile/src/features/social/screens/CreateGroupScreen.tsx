import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../store/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import { font, spacing, radius, shadow } from '../../../constants/theme';

const EMOJIS = [
  { icon: 'flame', color: '#ff6b6b' },
  { icon: 'fitness', color: '#4ecdc4' },
  { icon: 'trophy', color: '#ffd93d' },
  { icon: 'flash', color: '#a8e6cf' },
  { icon: 'rocket', color: '#ff8b94' },
  { icon: 'star', color: '#ffd93d' },
  { icon: 'diamond', color: '#c7ceea' },
  { icon: 'medal', color: '#ffd93d' },
  { icon: 'color-palette', color: '#ff6b6b' },
  { icon: 'heart', color: '#ff6b6b' },
  { icon: 'musical-notes', color: '#a8e6cf' },
  { icon: 'game-controller', color: '#4ecdc4' },
  { icon: 'football', color: '#ff8b94' },
  { icon: 'basketball', color: '#ffd93d' },
  { icon: 'barbell', color: '#4ecdc4' },
  { icon: 'body', color: '#a8e6cf' },
  { icon: 'walk', color: '#ff6b6b' },
];

export default function CreateGroupScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('flame');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(25);

  const createMutation = useMutation({
    mutationFn: (data: any) => groupsApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.goBack();
    },
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      avatar_emoji: emoji,
      is_public: isPublic,
      max_members: maxMembers,
    });
  };

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      <Header title="Create Group" subtitle="Build your community" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Group Name */}
          <Card padding="lg" shadow="sm">
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="text" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Group Name</Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              placeholder="Enter group name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={[styles.charCount, { color: colors.textDim }]}>
              {name.length}/50
            </Text>
          </Card>

          {/* Description */}
          <Card padding="lg" shadow="sm">
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIcon, { backgroundColor: colors.blue + '15' }]}>
                <Ionicons name="document-text" size={18} color={colors.blue} />
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.surface, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              placeholder="What's this group about?"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.textDim }]}>
              {description.length}/200
            </Text>
          </Card>

          {/* Avatar Emoji */}
          <Card padding="lg" shadow="sm">
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIcon, { backgroundColor: colors.purple + '15' }]}>
                <Ionicons name="color-palette" size={18} color={colors.purple} />
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Avatar Icon</Text>
            </View>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.emojiBtn, {
                    backgroundColor: emoji === e.icon ? colors.primary : colors.surface,
                    borderColor: emoji === e.icon ? colors.primary : colors.border,
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setEmoji(e.icon);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={e.icon as any} 
                    size={24} 
                    color={emoji === e.icon ? '#fff' : e.color} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Settings */}
          <Card padding="lg" shadow="sm">
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIcon, { backgroundColor: colors.green + '15' }]}>
                <Ionicons name="settings" size={18} color={colors.green} />
              </View>
              <Text style={[styles.label, { color: colors.text }]}>Settings</Text>
            </View>

            {/* Public Toggle */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={isPublic ? 'globe' : 'lock-closed'} 
                  size={20} 
                  color={isPublic ? colors.green : colors.textMuted} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Public Group</Text>
                  <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                    {isPublic ? 'Anyone can discover and join' : 'Invite only'}
                  </Text>
                </View>
              </View>
              <Switch 
                value={isPublic} 
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsPublic(val);
                }}
                trackColor={{ false: colors.border, true: colors.green + '40' }}
                thumbColor={isPublic ? colors.green : colors.textDim}
              />
            </View>

            {/* Max Members */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Max Members</Text>
                  <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Group capacity</Text>
                </View>
              </View>
            </View>
            <View style={styles.optionsRow}>
              {[10, 25, 50, 100].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionBtn, {
                    backgroundColor: maxMembers === val ? colors.primary : colors.surface,
                    borderColor: maxMembers === val ? colors.primary : colors.border,
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setMaxMembers(val);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { 
                    color: maxMembers === val ? '#fff' : colors.text 
                  }]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createBtn, { 
              backgroundColor: colors.primary,
              opacity: !name.trim() || createMutation.isPending ? 0.5 : 1,
            }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              handleCreate();
            }}
            disabled={!name.trim() || createMutation.isPending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'dd']}
              style={styles.createBtnGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.createText}>
                {createMutation.isPending ? 'Creating...' : 'Create Group'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: { 
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { 
    fontSize: font.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  input: { 
    padding: spacing.md,
    borderRadius: radius.lg,
    fontSize: font.md,
    borderWidth: 1,
    fontWeight: '600',
  },
  textArea: { 
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: font.xs,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  emojiGrid: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiBtn: { 
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: font.md,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: font.xs,
    marginTop: 2,
  },
  optionsRow: { 
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionBtn: { 
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  optionText: { 
    fontSize: font.md,
    fontWeight: '800',
  },
  createBtn: { 
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.lg,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  createText: { 
    color: '#fff',
    fontSize: font.lg,
    fontWeight: '800',
  },
});
