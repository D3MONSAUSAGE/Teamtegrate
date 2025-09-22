import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';
import { TimeApprovalDashboard } from '@/components/manager/TimeApprovalDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/ui/error-boundary';

const SchedulePage: React.FC = () => {
  const { hasRoleAccess, user, loading } = useAuth();

  console.log('SchedulePage: Auth state:', { 
    hasUser: !!user, 
    userRole: user?.role, 
    loading,
    hasManagerAccess: hasRoleAccess('manager')
  });

  // Show loading state while auth is being determined
  if (loading) {
    console.log('SchedulePage: Still loading auth state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('SchedulePage: No user found, redirecting');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the schedule.</p>
        </div>
      </div>
    );
  }

  console.log('SchedulePage: Rendering dashboard for role:', user.role);

  // Show manager dashboard with tabs for managers and admins
  if (hasRoleAccess('manager')) {
    console.log('SchedulePage: Showing manager dashboard with tabs');
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <p className="text-muted-foreground">
              Manage schedules, time entries, and approvals
            </p>
          </div>
          
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Schedule Management</TabsTrigger>
              <TabsTrigger value="approvals">Time Entry Approvals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="space-y-6">
              <ScheduleManagerDashboard />
            </TabsContent>
            
            <TabsContent value="approvals" className="space-y-6">
              <TimeApprovalDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </ErrorBoundary>
    );
  }

  console.log('SchedulePage: Showing employee dashboard');
  return (
    <ErrorBoundary>
      <ScheduleEmployeeDashboard />
    </ErrorBoundary>
  );
};

export default SchedulePage;