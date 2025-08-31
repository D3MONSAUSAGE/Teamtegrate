import React, { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, BarChart3, List, User, FolderOpen } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

import { TeamMemberSelector } from './TeamMemberSelector';
import { WeeklyTaskPerformance } from './WeeklyTaskPerformance';
import { WeeklyHoursReport } from './WeeklyHoursReport';
import { WeeklyProjectContributions } from './WeeklyProjectContributions';
import { WeeklyDetailedTasks } from './WeeklyDetailedTasks';

import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { useEmployeeDetailedTasks } from '@/hooks/useEmployeeDetailedTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedUsers } from '@/hooks/useRoleBasedUsers';

interface WeeklyDashboardProps {
  timeRange: string;
  dateRange?: DateRange;
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  timeRange,
  dateRange
}) => {
  const { user } = useAuth();
  const { users: availableUsers, canViewTeamMembers } = useRoleBasedUsers();
  
  // Set default selected member to current user
  const [selectedMemberId, setSelectedMemberId] = useState<string>(user?.id || '');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(dateRange);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7 days');
  
  // Use 7 days for weekly view regardless of the parent timeRange
  const weeklyTimeRange = selectedTimeRange;
  
  // Get employee reports data
  const { taskStats, hoursStats, contributions, isLoading, error } = useEmployeeReports({
    userId: selectedMemberId,
    timeRange: weeklyTimeRange,
    dateRange: customDateRange || dateRange
  });

  // Get detailed tasks data
  const {
    allTasks,
    todoTasks,
    inProgressTasks,
    completedTasks,
    overdueTasks,
    projectGroups,
    summary,
    isLoading: isLoadingDetailedTasks,
    error: detailedTasksError
  } = useEmployeeDetailedTasks({
    userId: selectedMemberId,
    timeRange: weeklyTimeRange,
    dateRange: customDateRange || dateRange
  });

  // Prepare team members data for selector
  const availableTeamMembers = useMemo(() => {
    return availableUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
  }, [availableUsers]);

  // Set initial selected member when data loads
  React.useEffect(() => {
    if (!selectedMemberId && user?.id) {
      setSelectedMemberId(user.id);
    }
  }, [user?.id, selectedMemberId]);

  // Ensure a team member is selected
  const isValidSelection = selectedMemberId && availableTeamMembers.some(m => m.id === selectedMemberId);

  // Calculate date range for display
  const displayDateRange = useMemo(() => {
    const activeRange = customDateRange || dateRange;
    if (activeRange?.from && activeRange?.to) {
      return `${format(activeRange.from, 'MMM dd')} - ${format(activeRange.to, 'MMM dd, yyyy')}`;
    }
    
    const endDate = new Date();
    const startDate = subDays(endDate, selectedTimeRange === '7 days' ? 6 : 
                                      selectedTimeRange === '30 days' ? 29 : 6);
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  }, [customDateRange, dateRange, selectedTimeRange]);

  const selectedMember = availableTeamMembers.find(member => member.id === selectedMemberId);
  
  // Time range options
  const timeRangeOptions = [
    { value: '7 days', label: 'This Week' },
    { value: '30 days', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  if (error || detailedTasksError) {
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
      {/* Top Filters Section */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Range Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Time Period
              </label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range (if selected) */}
            {selectedTimeRange === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Range</label>
                <DatePickerWithRange
                  date={customDateRange}
                  onDateChange={setCustomDateRange}
                  className="w-full"
                />
              </div>
            )}

            {/* Projects Display - Fixed */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Projects
              </label>
              <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                <Badge variant="secondary" className="text-sm">
                  All Projects
                </Badge>
              </div>
            </div>
          </div>

          {/* Reporting Period Display */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Reporting Period: <span className="font-medium text-foreground">{displayDateRange}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Member Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <TeamMemberSelector
              teamMembers={availableTeamMembers}
              selectedMember={selectedMemberId}
              onMemberChange={setSelectedMemberId}
              isLoading={isLoading}
            />
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

          {!isValidSelection && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4">
              <p className="text-sm text-destructive font-medium">
                {canViewTeamMembers ? "Team member selection required" : "Personal reports only"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {canViewTeamMembers 
                  ? "Please select a team member to view their performance data."
                  : "You can only view your own performance data."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Performance Data - Only show if valid selection */}
      {isValidSelection ? (
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Summary
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Detailed Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6 mt-6">
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
              allTasks={allTasks}
              todoTasks={todoTasks}
              inProgressTasks={inProgressTasks}
              completedTasks={completedTasks}
              overdueTasks={overdueTasks}
              projectGroups={projectGroups}
              summary={summary}
              isLoading={isLoadingDetailedTasks}
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* No valid selection state */
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-3">
              <User className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">Select a Team Member</h3>
              <p className="text-sm text-muted-foreground">Choose a team member from the dropdown above to view their weekly performance data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};