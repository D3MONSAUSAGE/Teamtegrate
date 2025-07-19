
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
import OptimizedRouter from '@/routes/OptimizedRouter';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize mobile optimizations early
  const { isOptimized } = useMobileOptimization({
    enableAndroidOptimization: true,
    enableViewportFix: true,
    enableTouchOptimization: true,
    optimizeScrolling: true,
    enableKeyboardHandling: true,
    enableReducedMotion: true
  });

  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <OptimizedRouter />
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
