import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/store/ThemeContext';
import RootNavigator from '@/navigation/RootNavigator';
import { initDB } from '@/db/localDB';
import { useAuthStore } from '@/store/useAuthStore';
import { startSyncListener } from '@/services/syncEngine';
import { registerBackgroundSync } from '@/services/backgroundSync';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppBootstrap() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    Promise.all([
      initDB().then(() => setDbReady(true)),
      hydrate(),
    ]).catch(console.error);

    registerBackgroundSync().catch(console.error);
    const unsubscribe = startSyncListener(
      undefined,
      // After background sync completes, invalidate dashboard + tasks so UI reflects synced state
      () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isHydrated || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#ff6b35" size="large" />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppBootstrap />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
