import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';
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

  // Show manager dashboard for managers and admins, employee dashboard for regular users
  if (hasRoleAccess('manager')) {
    console.log('SchedulePage: Showing manager dashboard');
    return (
      <ErrorBoundary>
        <ScheduleManagerDashboard />
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