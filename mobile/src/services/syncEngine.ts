import NetInfo from '@react-native-community/netinfo';
import { api } from '@/services/api';
import {
  getPendingActions,
  getPendingCount,
  markActionProcessed,
  markActionFailed,
  clearProcessedActions,
} from '@/db/localDB';

let isSyncing = false;

// Exposed so UI can show "X pending" badge
export async function getPendingSyncCount(): Promise<number> {
  return getPendingCount();
}

export async function flushPendingQueue(
  onInvalidate?: () => void
): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };

  const net = await NetInfo.fetch();
  if (!net.isConnected) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    // getPendingActions already filters by next_retry_at <= now (backoff enforced in DB)
    const pending = await getPendingActions();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    const actions = pending.map((p: any) => ({
      action_type:      p.action_type,
      payload:          JSON.parse(p.payload),
      idempotency_key:  p.idempotency_key,
      client_timestamp: p.created_at,
    }));

    try {
      const res = await api.post('/tasks/sync/batch', { actions });
      const results: any[] = res.data.results ?? [];

      for (let i = 0; i < pending.length; i++) {
        const result = results[i];
        // 'already_completed' is a valid idempotent success — treat as processed
        if (result?.status === 'ok' || result?.status === 'already_completed') {
          await markActionProcessed(pending[i].id);
          synced++;
        } else {
          // markActionFailed sets next_retry_at via exponential backoff in SQL
          await markActionFailed(pending[i].id, result?.error ?? 'server_error');
          failed++;
        }
      }
    } catch (err: any) {
      // Network-level failure — mark all for retry with backoff
      for (const action of pending) {
        await markActionFailed(action.id, err?.message ?? 'network_error');
        failed++;
      }
    }

    await clearProcessedActions();

    // Invalidate React Query cache so UI reflects synced state
    if (synced > 0 && onInvalidate) {
      onInvalidate();
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export function startSyncListener(
  onSync?: (result: { synced: number; failed: number }) => void,
  onInvalidate?: () => void,
) {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushPendingQueue(onInvalidate).then((result) => {
        if (result.synced > 0 && onSync) onSync(result);
      });
    }
  });
}
