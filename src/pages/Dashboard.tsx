import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import TimeTracking from '@/components/dashboard/TimeTracking';
import RecentProjects from '@/components/dashboard/RecentProjects';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import SessionHealthIndicator from '@/components/auth/SessionHealthIndicator';
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const { tasks } = useTask();
  const { projects, isLoading: projectsLoading, refreshProjects } = useProjects();

  console.log('Dashboard: Rendering with auth state:', {
    loading,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    organizationId: user?.organizationId
  });

  // Show loading only if auth is still being determined
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workspace...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Setting up your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading is complete, redirect to login
  if (!isAuthenticated || !user) {
    console.log('Dashboard: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Show organization setup message if needed
  if (!user.organizationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SessionHealthIndicator />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Organization Setup Required</h2>
          <p className="text-muted-foreground">
            Your account needs to be associated with an organization to access the dashboard.
            Please contact your administrator or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Filter tasks for today and upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const upcomingTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const handleCreateTask = () => {
    console.log('Create task triggered');
  };

  const handleEditTask = (task: any) => {
    console.log('Edit task triggered:', task.title);
  };

  const handleViewTasks = (project: any) => {
    console.log('View tasks for project:', project.title);
  };

  const handleCreateTaskForProject = (project: any) => {
    console.log('Create task for project:', project.title);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <SessionHealthIndicator />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your projects today.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <DailyTasksSection 
            tasks={todaysTasks}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        </div>
        <div>
          <TimeTracking />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentProjects 
          projects={projects}
          onViewTasks={handleViewTasks}
          onCreateTask={handleCreateTaskForProject}
          onRefresh={refreshProjects}
        />
        <UpcomingTasksSection 
          tasks={upcomingTasks}
          onCreateTask={handleCreateTask}
          onEditTask={handleEditTask}
        />
      </div>

      <AnalyticsSection />
    </div>
  );
};

export default Dashboard;
