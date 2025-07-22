
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthPage from "@/pages/auth/AuthPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import ProjectsPage from "@/pages/ProjectsPage";
import TasksPage from "@/pages/TasksPage";
import ChatPage from "@/pages/ChatPage";
import CalendarPage from "@/pages/CalendarPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ProfilePage from "@/pages/ProfilePage";
import InvoicesPage from "@/pages/InvoicesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import JournalPage from "@/pages/JournalPage";
import MobileSetupPage from "@/pages/MobileSetupPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminInvitesPage from "@/pages/admin/AdminInvitesPage";
import AdminTeamsPage from "@/pages/admin/AdminTeamsPage";
import AdminOrganizationPage from "@/pages/admin/AdminOrganizationPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import TimesheetPage from "@/pages/TimesheetPage";
import SupabaseNotificationManager from "@/components/SupabaseNotificationManager";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TaskProvider>
              <ProjectProvider>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/mobile-setup" element={<MobileSetupPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="invoices" element={<InvoicesPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="journal" element={<JournalPage />} />
                    <Route path="timesheet" element={<TimesheetPage />} />
                    <Route path="admin/users" element={<AdminUsersPage />} />
                    <Route path="admin/invites" element={<AdminInvitesPage />} />
                    <Route path="admin/teams" element={<AdminTeamsPage />} />
                    <Route path="admin/organization" element={<AdminOrganizationPage />} />
                    <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
                  </Route>
                </Routes>
                <SupabaseNotificationManager />
              </ProjectProvider>
            </TaskProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
