
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from '@/contexts/SimpleAuthContext'
import Index from "./pages/Index"
import SimpleLoginPage from "./pages/SimpleLoginPage"
import DashboardPage from "./pages/DashboardPage"
import TasksPage from "./pages/TasksPage"
import ProjectsPage from "./pages/ProjectsPage"
import CalendarPage from "./pages/CalendarPage"
import TeamPage from "./pages/TeamPage"
import ChatPage from "./pages/ChatPage"
import NotificationsPage from "./pages/NotificationsPage"
import ReportsPage from "./pages/ReportsPage"
import TimeTrackingPage from "./pages/TimeTrackingPage"
import FocusZonePage from "./pages/FocusZonePage"
import DocumentsPage from "./pages/DocumentsPage"
import FinancePage from "./pages/FinancePage"
import NotebookPage from "./pages/NotebookPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import ProjectTasksPage from "./pages/ProjectTasksPage"
import AppLayout from "./components/AppLayout"
import ProtectedRoute from "./components/ProtectedRoute"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes - no auth required */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={
              <AuthProvider>
                <SimpleLoginPage />
              </AuthProvider>
            } />
            
            {/* Protected routes - wrapped in ProtectedRoute */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId/tasks" element={<ProjectTasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="time-tracking" element={<TimeTrackingPage />} />
              <Route path="focus-zone" element={<FocusZonePage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="notebook" element={<NotebookPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
