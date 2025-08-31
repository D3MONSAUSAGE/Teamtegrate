import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, BarChart3, List, Calendar, TrendingUp } from 'lucide-react';
import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { WeeklyTaskPerformance } from '../weekly/WeeklyTaskPerformance';
import { WeeklyHoursReport } from '../weekly/WeeklyHoursReport';
import { WeeklyProjectContributions } from '../weekly/WeeklyProjectContributions';
import { WeeklyDetailedTasks } from '../weekly/WeeklyDetailedTasks';
import { useEmployeeDetailedTasks } from '@/hooks/useEmployeeDetailedTasks';
import { format, subDays } from 'date-fns';

interface PersonalDashboardProps {
  userId: string;
  userName: string;
  timeRange: string;
  dateRange?: DateRange;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  userId,
  userName,
  timeRange,
  dateRange
}) => {
  // Get employee reports data
  const { taskStats, hoursStats, contributions, isLoading, error } = useEmployeeReports({
    userId,
    timeRange,
    dateRange
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
    userId,
    timeRange,
    dateRange
  });

  // Calculate date range for display
  const displayDateRange = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    
    const endDate = new Date();
    const startDate = subDays(endDate, timeRange === '7 days' ? 6 : 
                                      timeRange === '30 days' ? 29 : 6);
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  }, [dateRange, timeRange]);

  if (error || detailedTasksError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Failed to load your performance data.</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Your Performance Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {displayDateRange}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-card border">
              <div className="text-2xl font-bold text-primary">
                {taskStats?.completed ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed Tasks</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border">
              <div className="text-2xl font-bold text-blue-600">
                {taskStats?.in_progress ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((hoursStats?.total_minutes ?? 0) / 60)}h
              </div>
              <div className="text-xs text-muted-foreground">Hours Worked</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-card border">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {taskStats?.total > 0 ? Math.round(((taskStats?.completed ?? 0) / taskStats.total) * 100) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tabs */}
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

          {/* Weekly Hours Report */}
          <WeeklyHoursReport 
            hoursStats={hoursStats} 
            isLoading={isLoading}
          />

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
    </div>
  );
};