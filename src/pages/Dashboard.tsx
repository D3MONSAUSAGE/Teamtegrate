
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import TimeTracking from '@/components/dashboard/TimeTracking';
import RecentProjects from '@/components/dashboard/RecentProjects';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import SessionHealthIndicator from '@/components/auth/SessionHealthIndicator';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Dashboard: Rendering with auth state:', {
    loading,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    organizationId: user?.organizationId
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Dashboard: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!user.organizationId) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
            <DailyTasksSection />
          </div>
          <div>
            <TimeTracking />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentProjects />
          <UpcomingTasksSection />
        </div>

        <AnalyticsSection />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
