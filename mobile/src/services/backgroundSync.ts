/**
 * Background Sync Service
 * Registers an Expo Background Fetch task that flushes the pending queue
 * every 15 minutes when the app is in the background.
 *
 * Must be imported at the root of the app (index.ts) BEFORE any navigation.
 */
import Constants from 'expo-constants';
import { flushPendingQueue } from '@/services/syncEngine';

export const BACKGROUND_SYNC_TASK = 'CONSISTENCY_BACKGROUND_SYNC';

const isNativeBuild = Constants.executionEnvironment !== 'storeClient' &&
  Constants.executionEnvironment !== 'standalone';

if (isNativeBuild) {
  const TaskManager = require('expo-task-manager');
  const BackgroundFetch = require('expo-background-fetch');

  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const result = await flushPendingQueue();
      return result.synced > 0
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function registerBackgroundSync() {
  if (!isNativeBuild) return;

  const BackgroundFetch = require('expo-background-fetch');
  const TaskManager = require('expo-task-manager');

  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export async function unregisterBackgroundSync() {
  if (!isNativeBuild) return;

  const BackgroundFetch = require('expo-background-fetch');
  const TaskManager = require('expo-task-manager');

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
