import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/store/ThemeContext';
import { ToastProvider } from '@/store/ToastContext';
import RootNavigator from '@/navigation/RootNavigator';
import { initDB } from '@/db/localDB';
import { useAuthStore } from '@/store/useAuthStore';
import { startSyncListener } from '@/services/syncEngine';
import { registerBackgroundSync } from '@/services/backgroundSync';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PushNotificationService, handleNotificationTap } from '@/services/pushNotifications';
import * as Notifications from 'expo-notifications';

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
  const token = useAuthStore((s) => s.token);
  const [dbReady, setDbReady] = useState(false);
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      initDB().then(() => setDbReady(true)),
      hydrate(),
    ]).catch(console.error);

    registerBackgroundSync().catch(console.error);
    const unsubscribe = startSyncListener(
      undefined,
      () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    );
    return () => unsubscribe();
  }, []);
  
  // Register for push notifications when user is logged in
  useEffect(() => {
    if (token) {
      PushNotificationService.registerForPushNotifications().catch(console.error);
    }
  }, [token]);
  
  // Setup notification listeners
  useEffect(() => {
    // Handle notification received while app is in foreground
    const receivedSubscription = PushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Clear badge when notification is received
        PushNotificationService.clearBadge();
      }
    );
    
    // Handle notification tap
    const responseSubscription = PushNotificationService.addNotificationResponseListener(
      (response) => {
        if (navigationRef.current) {
          handleNotificationTap(response, navigationRef.current);
        }
      }
    );
    
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  if (!isHydrated || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#ff6b35" size="large" />
      </View>
    );
  }

  return <RootNavigator ref={navigationRef} />;
}

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <AppBootstrap />
            </QueryClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </View>
  );
}
