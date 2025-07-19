
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import ProjectsPage from "./pages/ProjectsPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import CalendarPage from "./pages/CalendarPage";
import DocumentsPage from "./pages/DocumentsPage";
import TimeTrackingPage from "./pages/TimeTrackingPage";
import JournalPage from "./pages/JournalPage";
import AdminPage from "./pages/AdminPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import PushNotificationManager from "./components/PushNotificationManager";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <PushNotificationManager />
              <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<DashboardPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="time-tracking" element={<TimeTrackingPage />} />
                    <Route path="journal" element={<JournalPage />} />
                    <Route path="admin" element={<AdminPage />} />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Toaster />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
