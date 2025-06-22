
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import NetworkPerformanceMonitor from '@/components/debug/NetworkPerformanceMonitor';
import { Toaster } from '@/components/ui/toaster';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/OptimizedRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UnifiedDataProvider>
          <TaskProvider>
            <ChatProvider>
              <RouterProvider router={router} />
              <NetworkPerformanceMonitor />
              <Toaster />
            </ChatProvider>
          </TaskProvider>
        </UnifiedDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
