import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, BarChart3, List } from 'lucide-react';

import { TeamMemberSelector } from './TeamMemberSelector';
import { WeeklyTaskPerformance } from './WeeklyTaskPerformance';
import { WeeklyHoursReport } from './WeeklyHoursReport';
import { WeeklyProjectContributions } from './WeeklyProjectContributions';
import { WeeklyDetailedTasks } from './WeeklyDetailedTasks';

import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { useEmployeeDetailedTasks } from '@/hooks/useEmployeeDetailedTasks';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';

interface WeeklyDashboardProps {
  timeRange: string;
  dateRange?: DateRange;
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  timeRange,
  dateRange
}) => {
  const { user } = useAuth();
  const { teamMembersPerformance } = useTeamMembers();
  
  // Set default selected member to current user
  const [selectedMemberId, setSelectedMemberId] = useState<string>(user?.id || '');
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  
  // Use 7 days for weekly view regardless of the parent timeRange
  const weeklyTimeRange = '7 days';
  
  // Get employee reports data
  const { taskStats, hoursStats, contributions, isLoading, error } = useEmployeeReports({
    userId: selectedMemberId,
    timeRange: weeklyTimeRange,
    dateRange
  });

  // Get detailed tasks data
  const detailedTasksData = useEmployeeDetailedTasks({
    userId: selectedMemberId,
    timeRange: weeklyTimeRange,
    dateRange
  });

  // Prepare team members data for selector
  const teamMembers = useMemo(() => {
    return teamMembersPerformance.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email
    }));
  }, [teamMembersPerformance]);

  // Set initial selected member when data loads
  React.useEffect(() => {
    if (!selectedMemberId && user?.id) {
      setSelectedMemberId(user.id);
    }
  }, [user?.id, selectedMemberId]);

  // Calculate date range for display
  const displayDateRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  }, [dateRange]);

  const selectedMember = teamMembers.find(member => member.id === selectedMemberId);

  if (error || detailedTasksData.error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Failed to load weekly performance data.</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Weekly Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <TeamMemberSelector
                teamMembers={teamMembers}
                selectedMember={selectedMemberId}
                onMemberChange={setSelectedMemberId}
                isLoading={isLoading}
              />
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Reporting Period</p>
              <p className="font-medium">{displayDateRange}</p>
            </div>
          </div>

          {selectedMember && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Analyzing performance for:</span>
              <span className="font-medium">{selectedMember.name}</span>
              {selectedMember.email && (
                <span className="text-sm text-muted-foreground">({selectedMember.email})</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'summary' | 'detailed')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Summary
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Detailed Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          {/* Weekly Task Performance */}
          <WeeklyTaskPerformance 
            taskStats={taskStats} 
            isLoading={isLoading}
          />

          <Separator />

          {/* Weekly Hours Report */}
          <WeeklyHoursReport 
            hoursStats={hoursStats} 
            isLoading={isLoading}
          />

          <Separator />

          {/* Weekly Project Contributions */}
          <WeeklyProjectContributions 
            contributions={contributions} 
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="detailed" className="mt-6">
          {/* Detailed Tasks View */}
          <WeeklyDetailedTasks 
            allTasks={detailedTasksData.allTasks || []}
            todoTasks={detailedTasksData.todoTasks || []}
            inProgressTasks={detailedTasksData.inProgressTasks || []}
            completedTasks={detailedTasksData.completedTasks || []}
            overdueTasks={detailedTasksData.overdueTasks || []}
            tasksByProject={detailedTasksData.tasksByProject || {}}
            totalTimeSpent={detailedTasksData.totalTimeSpent || 0}
            summary={detailedTasksData.summary || {
              total: 0,
              todo: 0,
              inProgress: 0,
              completed: 0,
              overdue: 0,
              highPriority: 0,
              mediumPriority: 0,
              lowPriority: 0,
            }}
            isLoading={detailedTasksData.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};