
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/task';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import ReportsPage from '@/pages/ReportsPage';
import ChatPage from '@/pages/ChatPage';
import DocumentsPage from '@/pages/DocumentsPage';
import FinancePage from '@/pages/FinancePage';
import JournalPage from '@/pages/JournalPage';
import NotebookPage from '@/pages/NotebookPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

import OrganizationDashboard from '@/pages/OrganizationDashboard';
import TeamPage from '@/pages/TeamPage';

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

// Simple layout wrapper for dashboard routes
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
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
                
                {/* Protected dashboard routes */}
                <Route path="/dashboard" element={
                  <DashboardLayout>
                    <DashboardPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/organization" element={
                  <DashboardLayout>
                    <OrganizationDashboard />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/team" element={
                  <DashboardLayout>
                    <TeamPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/calendar" element={
                  <DashboardLayout>
                    <CalendarPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/reports" element={
                  <DashboardLayout>
                    <ReportsPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/chat" element={
                  <DashboardLayout>
                    <ChatPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/chat/:roomId" element={
                  <DashboardLayout>
                    <ChatPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/documents" element={
                  <DashboardLayout>
                    <DocumentsPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/finance" element={
                  <DashboardLayout>
                    <FinancePage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/journal" element={
                  <DashboardLayout>
                    <JournalPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/notebook" element={
                  <DashboardLayout>
                    <NotebookPage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/profile" element={
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                } />
                <Route path="/dashboard/settings" element={
                  <DashboardLayout>
                    <SettingsPage />
                  </DashboardLayout>
                } />
              </Routes>
            </TaskProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
