import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import AppLayout from './components/layout/AppLayout'
import { Toaster } from '@/components/ui/toaster'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  }
})

import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import NetworkPerformanceMonitor from '@/components/debug/NetworkPerformanceMonitor';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UnifiedDataProvider>
          <TaskProvider>
            <ChatProvider>
              <div className="min-h-screen bg-background">
                <AppLayout />
                <NetworkPerformanceMonitor />
                <Toaster />
              </div>
            </ChatProvider>
          </TaskProvider>
        </UnifiedDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
