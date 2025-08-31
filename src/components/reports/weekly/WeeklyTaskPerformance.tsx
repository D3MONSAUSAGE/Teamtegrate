import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

interface DailyTaskData {
  day: string;
  completed_count: number;
  assigned_count: number;
}

interface WeeklyTaskPerformanceProps {
  taskStats: DailyTaskData[] | null;
  isLoading: boolean;
}

export const WeeklyTaskPerformance: React.FC<WeeklyTaskPerformanceProps> = ({ 
  taskStats, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Task Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate last 7 days for comparison
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  // Create chart data with proper day labels
  const chartData = last7Days.map(dateStr => {
    const statForDay = taskStats?.find(stat => 
      format(new Date(stat.day), 'yyyy-MM-dd') === dateStr
    );
    
    return {
      day: format(new Date(dateStr), 'EEE'),
      fullDate: dateStr,
      completed: statForDay?.completed_count || 0,
      assigned: statForDay?.assigned_count || 0,
      completionRate: statForDay?.assigned_count 
        ? Math.round((statForDay.completed_count / statForDay.assigned_count) * 100)
        : 0
    };
  });

  // Calculate weekly summary
  const totalCompleted = chartData.reduce((sum, day) => sum + day.completed, 0);
  const totalAssigned = chartData.reduce((sum, day) => sum + day.assigned, 0);
  const weeklyCompletionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  const averageDailyTasks = Math.round(totalCompleted / 7);

  // Find best and worst days
  const bestDay = chartData.reduce((best, day) => 
    day.completed > best.completed ? day : best, chartData[0]
  );
  const trendDirection = chartData[6]?.completed >= chartData[0]?.completed ? 'up' : 'down';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Completed</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Weekly Rate</p>
                <p className="text-2xl font-bold">{weeklyCompletionRate}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${weeklyCompletionRate >= 80 ? 'text-green-500' : weeklyCompletionRate >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{averageDailyTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Best Day</p>
                <p className="text-lg font-bold">{bestDay?.day}</p>
                <p className="text-sm text-muted-foreground">{bestDay?.completed} tasks</p>
              </div>
              <Badge variant={trendDirection === 'up' ? 'default' : 'secondary'}>
                {trendDirection === 'up' ? '↗️' : '↘️'} Trend
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Task Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      value, 
                      name === 'completed' ? 'Completed' : 'Assigned'
                    ]}
                    labelFormatter={(label) => {
                      const dayData = chartData.find(d => d.day === label);
                      return dayData ? `${label} (${format(new Date(dayData.fullDate), 'MMM dd')})` : label;
                    }}
                  />
                  <Bar dataKey="assigned" fill="hsl(var(--muted))" name="assigned" />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No task data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                    labelFormatter={(label) => {
                      const dayData = chartData.find(d => d.day === label);
                      return dayData ? `${label} (${format(new Date(dayData.fullDate), 'MMM dd')})` : label;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No completion rate data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};