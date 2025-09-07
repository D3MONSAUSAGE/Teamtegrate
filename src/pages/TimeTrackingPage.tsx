import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Components
import { SimplifiedTimeTracking } from '@/components/dashboard/SimplifiedTimeTracking';
import PastTimeEntriesManager from '@/components/time-entries/PastTimeEntriesManager';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';

const TimeTrackingPage = () => {
  const { hasRoleAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('time-tracking');
  
  // Role-based access control
  const isAdmin = hasRoleAccess('admin');
  const isManager = hasRoleAccess('manager');
  const canManageTeams = isAdmin || isManager;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="time-entries">Time Entries</TabsTrigger>
        </TabsList>

        {/* Time Tracking Tab - Main employee dashboard */}
        <TabsContent value="time-tracking" className="space-y-4">
          <SimplifiedTimeTracking />
        </TabsContent>

        {/* Schedule Tab - Personal schedule view */}
        <TabsContent value="schedule" className="space-y-4">
          <ScheduleEmployeeDashboard />
        </TabsContent>

        {/* Time Entries Tab - Historical entries and corrections */}
        <TabsContent value="time-entries" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {canManageTeams ? 'Time Entries & Correction Requests' : 'My Time Entries'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {canManageTeams 
                ? 'Manage time entries and review correction requests. Team members can request corrections that will be routed through the proper approval chain.'
                : 'View your historical time entries and submit correction requests. Requests will be routed to your manager for approval.'
              }
            </p>
            <PastTimeEntriesManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTrackingPage;
