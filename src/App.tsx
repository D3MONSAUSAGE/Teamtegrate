
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/task";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import ProjectsPage from "./pages/ProjectsPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import TimelinePage from "./pages/TimelinePage";
import TimeTrackingPage from "./pages/TimeTrackingPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import DocumentsPage from "./pages/DocumentsPage";
import FinancePage from "./pages/FinancePage";
import ChatPage from "./pages/ChatPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TaskProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="time-tracking" element={<TimeTrackingPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="finance" element={<FinancePage />} />
                {/* ChecklistsPage route removed */}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TaskProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
