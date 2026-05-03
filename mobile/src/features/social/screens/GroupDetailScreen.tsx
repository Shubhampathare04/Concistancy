import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../store/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../../components/ScreenWrapper';
import Header from '../../../components/Header';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import { font, spacing, radius, shadow, gradients } from '../../../constants/theme';

type TabType = 'chat' | 'challenges' | 'members';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'chat', label: 'Chat', icon: 'chatbubbles' },
  { key: 'challenges', label: 'Challenges', icon: 'trophy' },
  { key: 'members', label: 'Members', icon: 'people' },
];

const REACTION_EMOJIS = [
  { icon: 'heart', color: '#ff6b6b' },
  { icon: 'thumbs-up', color: '#4ecdc4' },
  { icon: 'happy', color: '#ffd93d' },
  { icon: 'flame', color: '#ff8b94' },
  { icon: 'trophy', color: '#ffd93d' },
  { icon: 'hand-left', color: '#a8e6cf' },
];

export default function GroupDetailScreen({ route }: any) {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [message, setMessage] = useState('');
  const [longPressedMessage, setLongPressedMessage] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getGroupDetail(groupId),
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['group', groupId, 'messages'],
    queryFn: () => groupsApi.getMessages(groupId),
    enabled: activeTab === 'chat',
  });

  const { data: challenges } = useQuery({
    queryKey: ['group', groupId, 'challenges'],
    queryFn: () => groupsApi.getChallenges(groupId),
    enabled: activeTab === 'challenges',
  });

  const { data: members } = useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: activeTab === 'members',
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => groupsApi.sendMessage(groupId, content),
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      groupsApi.reactToMessage(groupId, messageId, emoji),
    onSuccess: () => refetchMessages(),
  });

  useEffect(() => {
    if (activeTab === 'chat') {
      const interval = setInterval(() => refetchMessages(), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSend = () => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    sendMutation.mutate(message);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    reactMutation.mutate({ messageId, emoji });
    setLongPressedMessage(null);
  };

  return (
    <ScreenWrapper padded={false} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <LinearGradient
          colors={[colors.primary + '25', colors.primary + '10']}
          style={styles.headerAvatar}
        >
          <Ionicons name={group?.avatar_emoji || 'people'} size={28} color={colors.primary} />
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
            {group?.name}
          </Text>
          <Text style={[styles.memberCount, { color: colors.textMuted }]}>
            {group?.member_count} members
          </Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab(tab.key);
            }}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.primary + '15' }]}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.key ? colors.primary : colors.textMuted} 
            />
            <Text style={[styles.tabText, { 
              color: activeTab === tab.key ? colors.primary : colors.textMuted 
            }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages || []}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setLongPressedMessage(item.id);
                }}
                style={[styles.messageBubble, item.is_own && styles.ownMessage]}
                activeOpacity={0.7}
              >
                <View style={[styles.bubble, { 
                  backgroundColor: item.is_own ? colors.primary : colors.card,
                }]}>
                  {!item.is_own && (
                    <Text style={[styles.sender, { color: colors.textMuted }]}>
                      {item.sender_name}
                    </Text>
                  )}
                  <Text style={[styles.messageText, { 
                    color: item.is_own ? '#fff' : colors.text 
                  }]}>
                    {item.content}
                  </Text>
                  {item.message_type === 'system' && (
                    <View style={[styles.systemBadge, { backgroundColor: colors.yellow + '20' }]}>
                      <Ionicons name="information-circle" size={12} color={colors.yellow} />
                      <Text style={[styles.systemText, { color: colors.yellow }]}>System</Text>
                    </View>
                  )}
                  {item.reactions && item.reactions.length > 0 && (
                    <View style={styles.reactionsRow}>
                      {item.reactions.map((r: any, i: number) => (
                        <View key={i} style={[styles.reactionBadge, { backgroundColor: colors.surface }]}>
                          <Ionicons name={r.emoji as any} size={14} color={colors.primary} />
                          <Text style={[styles.reactionCount, { color: colors.textMuted }]}>
                            {r.count || 1}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {longPressedMessage === item.id && (
                  <View style={[styles.emojiPicker, { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}>
                    {REACTION_EMOJIS.map((emoji, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleReaction(item.id, emoji.icon)}
                        style={[styles.emojiOption, { backgroundColor: colors.surface }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={emoji.icon as any} size={24} color={emoji.color} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.chatList}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubbles-outline"
                title="No messages yet"
                subtitle="Be the first to start the conversation"
              />
            }
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={[styles.inputBar, { 
            backgroundColor: colors.card, 
            borderTopColor: colors.border 
          }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text 
              }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { 
                backgroundColor: message.trim() ? colors.primary : colors.border,
              }]}
              onPress={handleSend}
              disabled={!message.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <FlatList
          data={challenges || []}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <Card padding="lg" shadow="md" style={{ marginBottom: spacing.md }}>
              <View style={styles.challengeHeader}>
                <View style={[styles.challengeIcon, { backgroundColor: colors.yellow + '20' }]}>
                  <Ionicons name="trophy" size={24} color={colors.yellow} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.challengeDesc, { color: colors.textMuted }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <View style={styles.challengeMeta}>
                <View style={[styles.metaItem, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="flag" size={14} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    Target: {item.target_value} {item.target_unit}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <LinearGradient
                  colors={gradients.primary}
                  style={[styles.progressFill, { 
                    width: `${Math.min((item.current_progress / item.target_value) * 100, 100)}%` 
                  }]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {item.current_progress || 0} / {item.target_value}
              </Text>
              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.logBtnText}>Log Progress</Text>
              </TouchableOpacity>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="trophy-outline"
              title="No challenges yet"
              subtitle="Create a challenge to compete with your group"
            />
          }
          ListHeaderComponent={
            group?.is_admin ? (
              <TouchableOpacity
                style={[styles.createChallengeBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  navigation.navigate('CreateGroupChallenge', { groupId });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createChallengeBtnText}>Create Challenge</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <FlatList
          data={members || []}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <Card padding="md" shadow="sm" style={{ marginBottom: spacing.sm }}>
              <View style={styles.memberCard}>
                <LinearGradient
                  colors={[colors.primary + '25', colors.primary + '10']}
                  style={styles.memberAvatar}
                >
                  <Ionicons name="person" size={24} color={colors.primary} />
                </LinearGradient>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {item.username}
                  </Text>
                  <View style={styles.memberStats}>
                    <View style={[styles.statBadge, { backgroundColor: colors.yellow + '15' }]}>
                      <Ionicons name="star" size={12} color={colors.yellow} />
                      <Text style={[styles.statText, { color: colors.yellow }]}>Lv {item.level}</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="flame" size={12} color={colors.primary} />
                      <Text style={[styles.statText, { color: colors.primary }]}>{item.streak}d</Text>
                    </View>
                  </View>
                </View>
                {item.role === 'admin' && (
                  <View style={[styles.badge, { backgroundColor: colors.purple }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    <Text style={styles.badgeText}>Admin</Text>
                  </View>
                )}
              </View>
            </Card>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: { 
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { 
    flex: 1,
  },
  groupName: { 
    fontSize: font.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  memberCount: { 
    fontSize: font.xs,
    marginTop: 2,
  },
  tabBar: { 
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  tab: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  tabText: { 
    fontSize: font.sm,
    fontWeight: '700',
  },
  chatList: { 
    padding: spacing.md,
    paddingBottom: 100,
  },
  messageBubble: { 
    maxWidth: '80%',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  ownMessage: { 
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.xl,
    ...shadow.sm,
  },
  sender: { 
    fontSize: font.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: { 
    fontSize: font.md,
    lineHeight: 20,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  systemText: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  reactionsRow: { 
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  reactionCount: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  emojiPicker: { 
    position: 'absolute',
    bottom: -50,
    left: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadow.lg,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: { 
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  input: { 
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    fontSize: font.md,
    maxHeight: 100,
  },
  sendBtn: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  list: { 
    padding: spacing.md,
    paddingBottom: 100,
  },
  challengeHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: { 
    fontSize: font.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  challengeDesc: { 
    fontSize: font.sm,
    marginTop: 4,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  metaText: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  progressBar: { 
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: { 
    height: '100%',
  },
  progressText: { 
    fontSize: font.sm,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  logBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  logBtnText: { 
    color: '#fff',
    fontSize: font.md,
    fontWeight: '800',
  },
  createChallengeBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  createChallengeBtnText: { 
    color: '#fff',
    fontSize: font.md,
    fontWeight: '800',
  },
  memberCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberAvatar: { 
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { 
    flex: 1,
    gap: spacing.sm,
  },
  memberName: { 
    fontSize: font.md,
    fontWeight: '700',
  },
  memberStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statText: {
    fontSize: font.xs,
    fontWeight: '700',
  },
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { 
    color: '#fff',
    fontSize: font.xs,
    fontWeight: '800',
  },
});
