
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectTasksPage from "@/pages/ProjectTasksPage";
import TasksPage from "@/pages/TasksPage";
import ChatPage from "@/pages/ChatPage";
import CalendarPage from "@/pages/CalendarPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ProfilePage from "@/pages/ProfilePage";
import JournalPage from "@/pages/JournalPage";
import TimeTrackingPage from "@/pages/TimeTrackingPage";
import NotebookPage from "@/pages/NotebookPage";
import SettingsPage from "@/pages/SettingsPage";
import TeamPage from "@/pages/TeamPage";
import AdminPage from "@/pages/AdminPage";
import LandingPage from "@/pages/LandingPage";
import Index from "@/pages/Index";
import OrganizationDashboard from "@/pages/OrganizationDashboard";
import FocusZonePage from "@/pages/FocusZonePage";
import ReportsPage from "@/pages/ReportsPage";
import FinancePage from "@/pages/FinancePage";
import MeetingsPage from "@/pages/MeetingsPage";
import TrainingPage from "@/pages/TrainingPage";
import NotificationsPage from "@/pages/NotificationsPage";
import RequestsPage from "@/pages/RequestsPage";
import NotificationBootstrap from "@/components/NotificationBootstrap";
import DedicatedTeamManagement from "@/components/team/management/DedicatedTeamManagement";
import TeamDetailPage from "@/pages/TeamDetailPage";
import OrganizationRolesPage from "@/pages/OrganizationRolesPage";
import EmployeeActionsPage from "@/pages/EmployeeActionsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:projectId/tasks" element={<ProjectTasksPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="requests" element={<RequestsPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="journal" element={<JournalPage />} />
                  <Route path="time-tracking" element={<TimeTrackingPage />} />
                  <Route path="notebook" element={<NotebookPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="team/:teamId" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
                  <Route path="team/manage/:teamId" element={<ProtectedRoute><DedicatedTeamManagement /></ProtectedRoute>} />
                  {/* Alias route for backward compatibility */}
                  <Route path="organization/teams/:teamId" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="organization" element={<OrganizationDashboard />} />
                   <Route path="organization/roles" element={<RoleProtectedRoute requiredRole="manager"><OrganizationRolesPage /></RoleProtectedRoute>} />
                   <Route path="employee-actions" element={<RoleProtectedRoute requiredRole="manager"><EmployeeActionsPage /></RoleProtectedRoute>} />
                  <Route path="focus" element={<FocusZonePage />} />
                  <Route path="reports" element={<RoleProtectedRoute requiredRole="manager"><ReportsPage /></RoleProtectedRoute>} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="meetings" element={<MeetingsPage />} />
                  <Route path="training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
                </Route>
                
                {/* Fallback for unmatched routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <NotificationBootstrap />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
