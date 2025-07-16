
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
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

const AuthRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('sb-zlfpiovyodiyecdueiig-auth-token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

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
              <Route path="/dashboard" element={<AuthRoutes><DashboardPage /></AuthRoutes>} />
              <Route path="/tasks" element={<AuthRoutes><TasksPage /></AuthRoutes>} />
              <Route path="/projects" element={<AuthRoutes><ProjectsPage /></AuthRoutes>} />
              <Route path="/journal" element={<AuthRoutes><JournalPage /></AuthRoutes>} />
              <Route path="/team" element={<AuthRoutes><TeamPage /></AuthRoutes>} />
              <Route path="/documents" element={<AuthRoutes><DocumentsPage /></AuthRoutes>} />
              <Route path="/calendar" element={<AuthRoutes><CalendarPage /></AuthRoutes>} />
              <Route path="/notifications" element={<AuthRoutes><NotificationsPage /></AuthRoutes>} />
              <Route path="/settings" element={<AuthRoutes><SettingsPage /></AuthRoutes>} />
              <Route path="/admin" element={<AuthRoutes><AdminPage /></AuthRoutes>} />
              <Route path="/profile" element={<AuthRoutes><ProfilePage /></AuthRoutes>} />
              <Route path="/dashboard/organization/employee/:userId" element={<AuthRoutes><EmployeeDashboard /></AuthRoutes>} />
              <Route path="/dashboard/organization" element={<AuthRoutes><OrganizationDashboard /></AuthRoutes>} />
              <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Page Not Found</h1></div>} />
            </Routes>
          </TaskProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
