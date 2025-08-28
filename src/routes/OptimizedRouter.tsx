
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useMemo } from 'react';
import React from 'react';
import LoadingFallback from '@/components/LoadingFallback';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRoutePreloader } from '@/hooks/useRoutePreloader';
import { isSafari, isAppleDevice } from '@/lib/browser';
import { MeetingsErrorBoundary } from '@/components/ErrorBoundary/MeetingsErrorBoundary';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';
import SafariNavigationWrapper from '@/components/navigation/SafariNavigationWrapper';

// Import Index component for the root route
const Index = lazy(() => import('@/pages/Index'));

// Lazy load pages with route-specific fallbacks
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));

// Dashboard pages with individual suspense boundaries
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectTasksPage = lazy(() => import('@/pages/ProjectTasksPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const FreshMeetingsPage = lazy(() => {
  console.log('🔄 Router: Starting to load FreshMeetingsPage...');
  return import('@/pages/FreshMeetingsPage').then(module => {
    console.log('✅ Router: FreshMeetingsPage module loaded successfully', module);
    return module;
  }).catch(error => {
    console.error('❌ Router: Failed to load FreshMeetingsPage:', error);
    throw error;
  });
});
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
const TrainingPage = lazy(() => import('@/pages/TrainingPage'));
const OrganizationDashboard = lazy(() => import('@/pages/OrganizationDashboard'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const EmployeeDashboard = lazy(() => import('@/pages/EmployeeDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Lightweight page wrapper for individual suspense
const PageWrapper = ({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
  console.log('PageWrapper: Rendering children');
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
};

const OptimizedRouter = () => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Enable route preloading for better performance
  useRoutePreloader();

  // Track URL changes for debugging
  React.useEffect(() => {
    console.log('🌐 URL CHANGE DETECTED:', {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      isAuthenticated,
      loading,
      hasUser: !!user,
      timestamp: new Date().toISOString()
    });
  }, [window.location.pathname, isAuthenticated, loading, user]);

  // Safari-specific debugging and stabilization
  React.useEffect(() => {
    if (isSafari() || isAppleDevice()) {
      console.log('🍎 Safari/Apple Device detected - Enhanced navigation mode enabled');
      console.log('🍎 Auth state:', { isAuthenticated, loading, hasUser: !!user });
      console.log('🍎 Current path:', window.location.pathname);
    }
  }, [isAuthenticated, loading, user]);

  // Debug logging
  console.log('OptimizedRouter: Auth state:', { isAuthenticated, loading });


  // Memoize auth redirects to prevent re-creation
  const authRedirects = useMemo(() => {
    if (!isAuthenticated) return null;
    
    return (
      <>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={<Navigate to="/dashboard" replace />} />
      </>
    );
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Routes>
      {/* Root route now uses Index component which handles auth routing */}
      <Route path="/" element={
        <PageWrapper>
          <Index />
        </PageWrapper>
      } />
      
      
      {/* Public routes with individual suspense */}
      <Route path="/login" element={
        <PageWrapper>
          <LoginPage />
        </PageWrapper>
      } />
      <Route path="/signup" element={
        <PageWrapper>
          <SignupPage />
        </PageWrapper>
      } />
      <Route path="/reset-password" element={
        <PageWrapper>
          <ResetPasswordPage />
        </PageWrapper>
      } />
      <Route path="/privacy" element={
        <PageWrapper>
          <PrivacyPolicyPage />
        </PageWrapper>
      } />
      
      {/* Protected routes with AppLayout and individual suspense boundaries */}
      <Route path="/dashboard" element={<AuthErrorBoundary><AppLayout /></AuthErrorBoundary>}>
        <Route index element={
          <PageWrapper>
            <DashboardPage />
          </PageWrapper>
        } />
        <Route path="tasks" element={
          <PageWrapper>
            <TasksPage />
          </PageWrapper>
        } />
        <Route path="projects" element={
          <PageWrapper>
            <ProjectsPage />
          </PageWrapper>
        } />
        <Route path="projects/:projectId/tasks" element={
          <PageWrapper>
            <ProjectTasksPage />
          </PageWrapper>
        } />
        <Route path="calendar" element={
          <PageWrapper>
            <CalendarPage />
          </PageWrapper>
        } />
        <Route path="meetings" element={
          <PageWrapper>
            <MeetingsErrorBoundary>
              <FreshMeetingsPage />
            </MeetingsErrorBoundary>
          </PageWrapper>
        } />
        <Route path="chat" element={
          <PageWrapper>
            <ChatPage />
          </PageWrapper>
        } />
        <Route path="team" element={
          <PageWrapper>
            <TeamPage />
          </PageWrapper>
        } />
        <Route path="team/:teamId" element={
          <PageWrapper>
            <TeamDetailPage />
          </PageWrapper>
        } />
        <Route path="profile" element={
          <PageWrapper>
            <ProfilePage />
          </PageWrapper>
        } />
        <Route path="settings" element={
          <PageWrapper>
            <SettingsPage />
          </PageWrapper>
        } />
        <Route path="reports" element={
          <PageWrapper>
            <ReportsPage />
          </PageWrapper>
        } />
        <Route path="time-tracking" element={
          <PageWrapper>
            <TimeTrackingPage />
          </PageWrapper>
        } />
        <Route path="notifications" element={
          <PageWrapper>
            <NotificationsPage />
          </PageWrapper>
        } />
        <Route path="documents" element={
          <PageWrapper>
            <DocumentsPage />
          </PageWrapper>
        } />
        <Route path="finance" element={
          <PageWrapper>
            <FinancePage />
          </PageWrapper>
        } />
        <Route path="journal" element={
          <PageWrapper>
            <JournalPage />
          </PageWrapper>
        } />
        <Route path="notebook" element={
          <PageWrapper>
            <NotebookPage />
          </PageWrapper>
        } />
        <Route path="timeline" element={
          <PageWrapper>
            <TimelinePage />
          </PageWrapper>
        } />
        <Route path="focus" element={
          <PageWrapper>
            <FocusZonePage />
          </PageWrapper>
        } />
        <Route path="training" element={
          <PageWrapper>
            {(() => {
              console.log('🎯 TRAINING ROUTE: Route element is rendering');
              console.log('🎯 TRAINING ROUTE: Current path:', window.location.pathname);
              console.log('🎯 TRAINING ROUTE: Auth state:', { isAuthenticated, loading });
              return <TrainingPage />;
            })()}
          </PageWrapper>
        } />
        <Route path="organization" element={
          <PageWrapper>
            <OrganizationDashboard />
          </PageWrapper>
        } />
        <Route path="organization/employee/:userId" element={
          <PageWrapper>
            <EmployeeDashboard />
          </PageWrapper>
        } />
        <Route path="admin" element={
          <PageWrapper>
            <AdminPage />
          </PageWrapper>
        } />
      </Route>
      
      {/* Auth redirects */}
      {authRedirects}
      
      {/* 404 route */}
      <Route path="*" element={
        <PageWrapper>
          <NotFound />
        </PageWrapper>
      } />
    </Routes>
  );
};

export default OptimizedRouter;
