
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
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
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/dashboard" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="time-tracking" element={<TimeTrackingPage />} />
                <Route path="notebook" element={<NotebookPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Routes>
            <SupabaseNotificationManager />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
