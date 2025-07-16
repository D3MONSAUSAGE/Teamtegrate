
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ProfilePage from '@/pages/ProfilePage';
import OrganizationDashboard from '@/pages/OrganizationDashboard';
import AdminPage from '@/pages/AdminPage';
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import JournalPage from '@/pages/JournalPage';
import TeamPage from '@/pages/TeamPage';
import DocumentsPage from '@/pages/DocumentsPage';
import CalendarPage from '@/pages/CalendarPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import EmployeeDashboard from '@/pages/EmployeeDashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TaskProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* All authenticated routes go through AppLayout */}
              <Route path="/*" element={<AppLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="dashboard/organization/employee/:userId" element={<EmployeeDashboard />} />
                <Route path="dashboard/organization" element={<OrganizationDashboard />} />
              </Route>
              
              <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Page Not Found</h1></div>} />
            </Routes>
          </TaskProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
