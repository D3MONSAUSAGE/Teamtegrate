

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import NetworkPerformanceMonitor from '@/components/debug/NetworkPerformanceMonitor';
import { Toaster } from '@/components/ui/toaster';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';

// --- Page components ---
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
// These imports assume you have these files:
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import OrganizationDashboard from './pages/OrganizationDashboard';

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
                  {/* Public / general routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* All protected routes - nested inside AppLayout */}
                  <Route path="/dashboard" element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="organization" element={<OrganizationDashboard />} />
                    {/* Add more nested routes here as needed */}
                  </Route>

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

