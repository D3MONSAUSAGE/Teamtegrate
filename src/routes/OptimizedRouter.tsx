
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectTasksPage = lazy(() => import('@/pages/ProjectTasksPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const TeamDetailPage = lazy(() => import('@/pages/TeamDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const TimeTrackingPage = lazy(() => import('@/pages/TimeTrackingPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const FinancePage = lazy(() => import('@/pages/FinancePage'));
const JournalPage = lazy(() => import('@/pages/JournalPage'));
const NotebookPage = lazy(() => import('@/pages/NotebookPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const FocusZonePage = lazy(() => import('@/pages/FocusZonePage'));
const OrganizationDashboard = lazy(() => import('@/pages/OrganizationDashboard'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const OptimizedRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected routes with AppLayout (includes sidebar + navbar) */}
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId/tasks" element={<ProjectTasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="team/:teamId" element={<TeamDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="time-tracking" element={<TimeTrackingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="notebook" element={<NotebookPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="focus" element={<FocusZonePage />} />
          <Route path="organization" element={<OrganizationDashboard />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        
        {/* Redirect authenticated users from public routes */}
        {isAuthenticated && (
          <>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default OptimizedRouter;
