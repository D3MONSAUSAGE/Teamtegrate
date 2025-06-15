
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import NetworkPerformanceMonitor from '@/components/debug/NetworkPerformanceMonitor';
import { Toaster } from '@/components/ui/toaster';

// Import routes and router provider
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// Import page components
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';

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
              <BrowserRouter>
                <Routes>
                  {/* Public and authentication routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  {/* All protected routes go through AppLayout */}
                  <Route path="/*" element={
                    <AppLayout />
                  } />
                  {/* Not found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <NetworkPerformanceMonitor />
                <Toaster />
              </BrowserRouter>
            </ChatProvider>
          </TaskProvider>
        </UnifiedDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
