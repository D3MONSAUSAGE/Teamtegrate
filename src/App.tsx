
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { TaskProvider } from './contexts/task/TaskContext'
import { ChatProvider } from './contexts/chat/ChatContext'
import { UnifiedDataProvider } from '@/contexts/UnifiedDataContext';
import { KeyboardShortcutsProvider } from '@/components/shared/KeyboardShortcutsProvider';
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
import ProjectTasksPage from './pages/ProjectTasksPage';
import OrganizationDashboard from './pages/OrganizationDashboard';
import CalendarPage from './pages/CalendarPage';
import FocusZonePage from './pages/FocusZonePage';
import ReportsPage from './pages/ReportsPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import FinancePage from './pages/FinancePage';
import NotebookPage from './pages/NotebookPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import ProfilePage from './pages/ProfilePage';

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
                <KeyboardShortcutsProvider>
                  <Routes>
                    {/* Public / general routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* All protected routes - nested inside AppLayout */}
                    <Route path="/dashboard" element={<AppLayout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="tasks" element={<TasksPage />} />
                      <Route path="projects" element={<ProjectsPage />} />
                      <Route path="projects/:projectId/tasks" element={<ProjectTasksPage />} />
                      <Route path="organization" element={<OrganizationDashboard />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="focus" element={<FocusZonePage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="documents" element={<DocumentsPage />} />
                      <Route path="finance" element={<FinancePage />} />
                      <Route path="notebook" element={<NotebookPage />} />
                      <Route path="time-tracking" element={<TimeTrackingPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      {/* Add more nested routes here as needed */}
                    </Route>

                    {/* Not found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <NetworkPerformanceMonitor />
                  <Toaster />
                </KeyboardShortcutsProvider>
              </BrowserRouter>
            </ChatProvider>
          </TaskProvider>
        </UnifiedDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
