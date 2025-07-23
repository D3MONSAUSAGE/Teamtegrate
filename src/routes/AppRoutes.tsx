
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import TimeTrackingPage from '@/pages/TimeTrackingPage';
import ProfilePage from '@/pages/ProfilePage';
import MobileMorePage from '@/pages/MobileMorePage';
import LoginPage from '@/pages/LoginPage';
import { 
  LazyCalendarPage,
  LazyFocusPage,
  LazyReportsPage,
  LazyDocumentsPage,
  LazyChatPage,
  LazyTeamPage,
  LazySettingsPage,
  LazyOrganizationPage,
  LazyFinancePage,
  LazyNotebookPage,
  LazyJournalPage,
  LazyTeamDetailPage
} from '@/pages/LazyPages';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {isAuthenticated ? (
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="time-tracking" element={<TimeTrackingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="more" element={<MobileMorePage />} />
          <Route path="calendar" element={<LazyCalendarPage />} />
          <Route path="focus" element={<LazyFocusPage />} />
          <Route path="reports" element={<LazyReportsPage />} />
          <Route path="documents" element={<LazyDocumentsPage />} />
          <Route path="chat" element={<LazyChatPage />} />
          <Route path="team" element={<LazyTeamPage />} />
          <Route path="settings" element={<LazySettingsPage />} />
          <Route path="organization" element={<LazyOrganizationPage />} />
          <Route path="finance" element={<LazyFinancePage />} />
          <Route path="notebook" element={<LazyNotebookPage />} />
          <Route path="journal" element={<LazyJournalPage />} />
          <Route path="team/:id" element={<LazyTeamDetailPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes;
