import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Calendar, Users } from 'lucide-react';
import { MyScheduleView } from '@/components/schedule/MyScheduleView';
import { TeamManagementView } from '@/components/schedule/TeamManagementView';
import ModernScheduleHeader from '@/components/schedule/modern/ModernScheduleHeader';

const SchedulePage: React.FC = () => {
  const { hasRoleAccess, user, loading } = useAuth();

  // Show loading state while auth is being determined
  if (loading) {
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the schedule.</p>
        </div>
      </div>
    );
  }

  const isManager = hasRoleAccess('manager');

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <ModernScheduleHeader
          title="Schedule Management"
          subtitle={isManager 
            ? "Manage schedules, assignments, and team operations" 
            : "View your schedule and track your time"
          }
        />
        
        <Tabs defaultValue="my-schedule" className="space-y-6">
          <TabsList className={`grid w-full ${isManager ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="my-schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Schedule
            </TabsTrigger>
            
            {isManager && (
              <TabsTrigger value="team-management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Management
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="my-schedule" className="space-y-6">
            <MyScheduleView />
          </TabsContent>
          
          {isManager && (
            <TabsContent value="team-management" className="space-y-6">
              <TeamManagementView />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default SchedulePage;