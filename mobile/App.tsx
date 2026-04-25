import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/store/ThemeContext';
import RootNavigator from '@/navigation/RootNavigator';
import { initDB } from '@/db/localDB';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 } },
});

export default function App() {
  useEffect(() => { initDB().catch(console.error); }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
