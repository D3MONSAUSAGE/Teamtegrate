import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Home,
  CheckSquare,
  Briefcase,
  Users,
  Calendar,
  Target,
  BarChart3,
  MessageCircle,
  FileText,
  DollarSign,
  BookOpen,
  NotebookPen,
} from 'lucide-react';

import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import TaskPage from '@/pages/TaskPage';
import ProjectPage from '@/pages/ProjectPage';
import CalendarPage from '@/pages/CalendarPage';
import FocusPage from '@/pages/FocusPage';
import ReportsPage from '@/pages/ReportsPage';
import ChatPage from '@/pages/ChatPage';
import DocumentsPage from '@/pages/DocumentsPage';
import FinancePage from '@/pages/FinancePage';
import PnlViewPage from '@/pages/PnlViewPage';
import JournalPage from '@/pages/JournalPage';
import NotebookPage from '@/pages/NotebookPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import AppLayout from '@/components/layout/AppLayout';

import OrganizationDashboard from '@/pages/OrganizationDashboard';

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={() => resetErrorBoundary()}>Try again</button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClient>
        <Router>
          <AuthProvider>
            <TaskProvider>
              <Routes>
                {/* Landing page route */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                
                {/* Protected dashboard routes */}
                <Route path="/dashboard" element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="tasks" element={<TaskPage />} />
                  <Route path="projects" element={<ProjectPage />} />
                  <Route path="organization" element={<OrganizationDashboard />} />
                  <Route path="team" element={<OrganizationDashboard />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="focus" element={<FocusPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/:roomId" element={<ChatPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="finance/pnl" element={<PnlViewPage />} />
                  <Route path="journal" element={<JournalPage />} />
                  <Route path="notebook" element={<NotebookPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </TaskProvider>
          </AuthProvider>
        </Router>
      </QueryClient>
    </ErrorBoundary>
  );
}

export default App;
