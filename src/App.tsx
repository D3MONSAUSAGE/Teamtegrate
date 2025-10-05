
import "./styles/scanner.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
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
import ReportsDashboard from "@/pages/ReportsDashboard";
import TaskReportsPage from "@/pages/TaskReportsPage";
import ChecklistReportsPage from "@/pages/ChecklistReportsPage";
import FinancePage from "@/pages/FinancePage";
import MeetingsPage from "@/pages/MeetingsPage";
import TrainingPage from "@/pages/TrainingPage";

// Finance Pages
import FinanceDashboardPage from "@/pages/finance/FinanceDashboardPage";
import InvoiceManagementPage from "@/pages/finance/InvoiceManagementPage";
import InvoiceCreationPage from "@/pages/finance/InvoiceCreationPage";
import ReportsPage from "@/pages/finance/ReportsPage";
import ClientsPage from "@/pages/finance/ClientsPage";
import PaymentSettingsPage from "@/pages/finance/PaymentSettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import EnhancedRequestsPage from "@/pages/EnhancedRequestsPage";
import ChecklistsPage from "@/pages/ChecklistsPage";
import NotificationBootstrap from "@/components/NotificationBootstrap";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import DedicatedTeamManagement from "@/components/team/management/DedicatedTeamManagement";
import TeamDetailPage from "@/pages/TeamDetailPage";
import OrganizationRolesPage from "@/pages/OrganizationRolesPage";
import EmployeeActionsPage from "@/pages/EmployeeActionsPage";
import RequestTypesPage from "@/pages/RequestTypesPage";
import SchedulePage from "@/pages/SchedulePage";
import ScannerStationPage from "@/pages/ScannerStationPage";
import GoogleCalendarCallback from "@/components/auth/GoogleCalendarCallback";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import { RecruitmentDashboard } from "@/pages/RecruitmentDashboard";
import CandidateDetailPage from "@/pages/CandidateDetailPage";
import CookiePolicyPage from "@/pages/CookiePolicyPage";
import SecurityPage from "@/pages/SecurityPage";
import InventoryPage from "@/pages/InventoryPage";
import InventoryDashboardPage from "@/pages/inventory/InventoryDashboardPage";
import InventoryCountPage from "@/pages/inventory/InventoryCountPage";
import InventoryRecordsPage from "@/pages/inventory/InventoryRecordsPage";
import InventoryWarehousePage from "@/pages/inventory/InventoryWarehousePage";
import InventoryManagementPage from "@/pages/inventory/InventoryManagementPage";
import InventoryRecallPage from "@/pages/inventory/InventoryRecallPage";
import WarehouseStockPage from "@/pages/inventory/warehouse/WarehouseStockPage";
import WarehouseProcessingPage from "@/pages/inventory/warehouse/WarehouseProcessingPage";
import WarehouseOutgoingPage from "@/pages/inventory/warehouse/WarehouseOutgoingPage";
import WarehouseReportsPage from "@/pages/inventory/warehouse/WarehouseReportsPage";


// Training Pages
import { TrainingDashboardPage } from "@/pages/training/TrainingDashboardPage";
import { MyTrainingPage } from "@/pages/training/MyTrainingPage";
import { VideoLibraryPage } from "@/pages/training/VideoLibraryPage";
import { TrainingAnalyticsPage } from "@/pages/training/TrainingAnalyticsPage";
import { TrainingContentPage } from "@/pages/training/management/TrainingContentPage";
import { TrainingAssignmentsPage } from "@/pages/training/management/TrainingAssignmentsPage";
import { VideoLibraryAdminPage } from "@/pages/training/management/VideoLibraryAdminPage";
import { EmployeeRecordsPage } from "@/pages/training/management/EmployeeRecordsPage";
import { CertificatesPage } from "@/pages/training/management/CertificatesPage";
import { RetrainingPage } from "@/pages/training/management/RetrainingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationsProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/auth/google/callback" element={<GoogleCalendarCallback />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/scanner-station" element={<ScannerStationPage />} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:projectId/tasks" element={<ProjectTasksPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="requests" element={<EnhancedRequestsPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                   <Route path="profile" element={<ProfilePage />} />
                   <Route path="journal" element={<JournalPage />} />
                   <Route path="time-tracking" element={<TimeTrackingPage />} />
                   <Route path="schedule" element={<SchedulePage />} />
                   <Route path="notebook" element={<NotebookPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="team/:teamId" element={<TeamDetailPage />} />
                  <Route path="team/manage/:teamId" element={<DedicatedTeamManagement />} />
                  {/* Alias route for backward compatibility */}
                  <Route path="organization/teams/:teamId" element={<TeamDetailPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="organization" element={<OrganizationDashboard />} />
                  <Route path="organization/roles" element={<RoleProtectedRoute requiredRole="manager"><OrganizationRolesPage /></RoleProtectedRoute>} />
                   <Route path="organization/request-types" element={<RoleProtectedRoute requiredRole="manager"><RequestTypesPage /></RoleProtectedRoute>} />
                   <Route path="employee-actions" element={<RoleProtectedRoute requiredRole="manager"><EmployeeActionsPage /></RoleProtectedRoute>} />
                   <Route path="recruitment" element={<RoleProtectedRoute requiredRole="manager"><RecruitmentDashboard /></RoleProtectedRoute>} />
                   <Route path="recruitment/candidate/:id" element={<RoleProtectedRoute requiredRole="manager"><CandidateDetailPage /></RoleProtectedRoute>} />
                  <Route path="focus" element={<FocusZonePage />} />
                   <Route path="reports" element={<RoleProtectedRoute requiredRole="manager"><ReportsDashboard /></RoleProtectedRoute>} />
                   <Route path="reports/tasks" element={<RoleProtectedRoute requiredRole="manager"><TaskReportsPage /></RoleProtectedRoute>} />
                   <Route path="reports/checklists" element={<RoleProtectedRoute requiredRole="manager"><ChecklistReportsPage /></RoleProtectedRoute>} />
                    
                    {/* Finance Routes - Keep original + add new nested routes */}
                    <Route path="finance" element={<FinancePage />} />
                    <Route path="finance/dashboard" element={<FinanceDashboardPage />} />
                    <Route path="finance/invoices" element={<InvoiceManagementPage />} />
                    <Route path="finance/create-invoice" element={<RoleProtectedRoute requiredRole="manager"><InvoiceCreationPage /></RoleProtectedRoute>} />
                    <Route path="finance/clients" element={<RoleProtectedRoute requiredRole="manager"><ClientsPage /></RoleProtectedRoute>} />
                    <Route path="finance/reports" element={<RoleProtectedRoute requiredRole="manager"><ReportsPage /></RoleProtectedRoute>} />
                    <Route path="finance/settings" element={<RoleProtectedRoute requiredRole="admin"><PaymentSettingsPage /></RoleProtectedRoute>} />
                     
                     <Route path="inventory" element={<InventoryPage />} />
                    
                    {/* New inventory routes - additive only */}
                    <Route path="inventory/overview" element={<InventoryDashboardPage />} />
                    <Route path="inventory/count" element={<InventoryCountPage />} />
                    <Route path="inventory/records" element={<InventoryRecordsPage />} />
                    <Route path="inventory/warehouse" element={<InventoryWarehousePage />} />
                    <Route path="inventory/warehouse/stock" element={<WarehouseStockPage />} />
                    <Route path="inventory/warehouse/processing" element={<WarehouseProcessingPage />} />
                    <Route path="inventory/warehouse/outgoing" element={<WarehouseOutgoingPage />} />
                    <Route path="inventory/warehouse/reports" element={<WarehouseReportsPage />} />
                    <Route path="inventory/management" element={<InventoryManagementPage />} />
                    <Route path="inventory/recall" element={<InventoryRecallPage />} />
                     <Route path="meetings" element={<MeetingsPage />} />
                     
                     {/* Training Routes - Keep original + add new nested routes */}
                     <Route path="training" element={<TrainingPage />} />
                     <Route path="training/dashboard" element={<TrainingDashboardPage />} />
                     <Route path="training/my-training" element={<MyTrainingPage />} />
                     <Route path="training/video-library" element={<VideoLibraryPage />} />
                     <Route path="training/analytics" element={<TrainingAnalyticsPage />} />
                     <Route path="training/management/content" element={<TrainingContentPage />} />
                     <Route path="training/management/assignments" element={<TrainingAssignmentsPage />} />
                     <Route path="training/management/video-library" element={<VideoLibraryAdminPage />} />
                     <Route path="training/management/employee-records" element={<EmployeeRecordsPage />} />
                     <Route path="training/management/certificates" element={<CertificatesPage />} />
                     <Route path="training/management/retraining" element={<RetrainingPage />} />
                     
                     <Route path="checklists" element={<ChecklistsPage />} />
                </Route>
                
                {/* Fallback for unmatched routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <NotificationBootstrap />
              <PWAInstallPrompt />
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
