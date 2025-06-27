
import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';
import AppLayout from '@/components/AppLayout';
import ProtectedLayout from '@/components/layout/AppLayout';

// Import critical pages immediately
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectTasksPage from '@/pages/ProjectTasksPage';
import TimeTrackingPage from '@/pages/TimeTrackingPage';

// Lazy load non-critical pages
import {
  LazyCalendarPage,
  LazyChatPage,
  LazyDocumentsPage,
  LazyFocusPage,
  LazyReportsPage,
  LazyTeamPage,
  LazyProfilePage,
  LazySettingsPage,
  LazyOrganizationPage,
  LazyFinancePage,
  LazyNotebookPage,
  LazyJournalPage,
  LazyTeamDetailPage
} from '@/pages/LazyPages';

// Lazy load project view components
const ProjectTasksView = React.lazy(() => import('@/components/task/ProjectTasksView'));

// Create router with optimized loading
export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/dashboard",
    element: <ProtectedLayout />,
    children: [
      {
        path: "",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "tasks",
            element: <TasksPage />,
          },
          {
            path: "tasks/create",
            element: <TasksPage />,
          },
          {
            path: "projects",
            element: <ProjectsPage />,
          },
          {
            path: "projects/:projectId/tasks",
            element: <ProjectTasksPage />,
          },
          {
            path: "time-tracking",
            element: <TimeTrackingPage />,
          },
          {
            path: "calendar",
            element: <LazyCalendarPage />,
          },
          {
            path: "chat",
            element: <LazyChatPage />,
          },
          {
            path: "chat/:roomId",
            element: <LazyChatPage />,
          },
          {
            path: "documents",
            element: <LazyDocumentsPage />,
          },
          {
            path: "focus",
            element: <LazyFocusPage />,
          },
          {
            path: "reports",
            element: <LazyReportsPage />,
          },
          {
            path: "team",
            element: <LazyTeamPage />,
          },
          {
            path: "team/:userId",
            element: <LazyTeamPage />,
          },
          {
            path: "profile",
            element: <LazyProfilePage />,
          },
          {
            path: "settings",
            element: <LazySettingsPage />,
          },
          {
            path: "organization",
            element: <LazyOrganizationPage />,
          },
          {
            path: "organization/teams/:teamId",
            element: <LazyTeamDetailPage />,
          },
          {
            path: "finance",
            element: <LazyFinancePage />,
          },
          {
            path: "notebook",
            element: <LazyNotebookPage />,
          },
          {
            path: "journal",
            element: <LazyJournalPage />,
          },
        ],
      },
    ],
  },
]);

// Preload critical routes on app start
export const preloadCriticalRoutes = () => {
  // Preload dashboard and tasks as they're most commonly accessed
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      // These are already imported, so this is just for future lazy routes
      import('@/pages/DashboardPage');
      import('@/pages/TasksPage');
      import('@/pages/ProjectsPage');
    });
  }
};
