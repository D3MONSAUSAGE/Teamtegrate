
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';

// Create a query client instance
const queryClient = new QueryClient();

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert" className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <TaskProvider>
              <Routes>
                {/* Landing page route */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected dashboard routes - using AppLayout which includes SidebarProvider */}
                <Route path="/dashboard/*" element={<AppLayout />} />
              </Routes>
            </TaskProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
