
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
import AppLayout from '@/components/AppLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import OrganizationPage from '@/pages/OrganizationPage';
import CalendarPage from '@/pages/CalendarPage';
import FocusPage from '@/pages/FocusPage';
import ReportsPage from '@/pages/ReportsPage';
import ChatPage from '@/pages/ChatPage';
import DocumentsPage from '@/pages/DocumentsPage';
import FinancePage from '@/pages/FinancePage';
import JournalPage from '@/pages/JournalPage';
import NotebookPage from '@/pages/NotebookPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './App.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  console.log('🚨 App.tsx: App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskProvider>
          <Router>
            <ErrorBoundary>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Protected routes with AppLayout */}
                  <Route path="/dashboard" element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route 
                      path="tasks" 
                      element={
                        <div>
                          {console.log('🚨 App.tsx: TasksPage route matched!')}
                          <TasksPage />
                        </div>
                      } 
                    />
                    <Route path="tasks/create" element={<TasksPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/:projectId" element={<ProjectsPage />} />
                    <Route path="organization" element={<OrganizationPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="focus" element={<FocusPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="chat/:roomId" element={<ChatPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="finance" element={<FinancePage />} />
                    <Route path="journal" element={<JournalPage />} />
                    <Route path="notebook" element={<NotebookPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="admin" element={<AdminPage />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster />
              </div>
            </ErrorBoundary>
          </Router>
        </TaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
