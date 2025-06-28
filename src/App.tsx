
import React, { memo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import NetworkPerformanceMonitor from '@/components/debug/NetworkPerformanceMonitor';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';
import OptimizedRouter from '@/routes/OptimizedRouter';

// Optimized query client with better caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduce retries for faster failure detection
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    }
  }
});

// Memoized providers to prevent unnecessary re-renders
const MemoizedProviders = memo(({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UnifiedDataProvider>
        <TaskProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </TaskProvider>
      </UnifiedDataProvider>
    </AuthProvider>
  </QueryClientProvider>
));

MemoizedProviders.displayName = 'MemoizedProviders';

function App() {
  return (
    <MemoizedProviders>
      <BrowserRouter>
        <OptimizedRouter />
      </BrowserRouter>
      <NetworkPerformanceMonitor />
      <Toaster />
    </MemoizedProviders>
  );
}

export default App;
