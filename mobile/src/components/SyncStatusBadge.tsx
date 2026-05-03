/**
 * SyncStatusBadge — shows pending offline sync count.
 * Appears on Profile tab and Profile screen.
 */
import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getPendingCount, resetFailedActions } from '@/db/localDB';
import { flushPendingQueue } from '@/services/syncEngine';
import { font, radius } from '@/constants/theme';

interface Props {
  compact?: boolean;
  onSync?: () => void;
}

export default function SyncStatusBadge({ compact, onSync }: Props) {
  const { colors } = useTheme();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const load = async () => setPending(await getPendingCount());
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (syncing) {
      spinAnim.current = Animated.loop(
        Animated.timing(spinValue, { toValue: 1, duration: 800, useNativeDriver: true })
      );
      spinAnim.current.start();
    } else {
      spinAnim.current?.stop();
      spinValue.setValue(0);
    }
  }, [syncing]);

  const spinStyle = {
    transform: [{ rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await flushPendingQueue(onSync);
      if (result.synced > 0) {
        setPending(await getPendingCount());
      }
    } finally {
      setSyncing(false);
    }
  };

  if (pending === 0 && !compact) return null;

  if (compact) {
    return pending > 0 ? (
      <View style={[s.dot, { backgroundColor: colors.yellow }]}>
        <Text style={s.dotTxt}>{pending > 9 ? '9+' : pending}</Text>
      </View>
    ) : null;
  }

  return (
    <TouchableOpacity
      style={[s.badge, { backgroundColor: colors.yellow + '14', borderColor: colors.yellow + '40' }]}
      onPress={handleSync}
      activeOpacity={0.7}
    >
      <Animated.View style={syncing ? spinStyle : undefined}>
        <Ionicons name={syncing ? 'sync' : 'cloud-upload-outline'} size={14} color={colors.yellow} />
      </Animated.View>
      <Text style={[s.txt, { color: colors.yellow }]}>
        {syncing ? 'Syncing...' : `${pending} pending`}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  txt: { fontSize: font.xs, fontWeight: '700' },
  dot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotTxt: { fontSize: 9, fontWeight: '800', color: '#000' },
});
