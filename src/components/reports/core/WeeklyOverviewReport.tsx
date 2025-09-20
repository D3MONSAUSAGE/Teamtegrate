import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, AlertCircle, Zap } from 'lucide-react';

interface WeeklyOverviewData {
  week_start: string;
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_velocity: number;
}

interface WeeklyOverviewReportProps {
  data: WeeklyOverviewData[];
  isLoading: boolean;
}

export const WeeklyOverviewReport: React.FC<WeeklyOverviewReportProps> = ({
  data,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const weekData = data[0] || {
    week_start: '',
    assigned_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    completion_velocity: 0
  };

  const pendingTasks = weekData.assigned_tasks - weekData.completed_tasks;
  const completionRate = weekData.assigned_tasks > 0 
    ? Math.round((weekData.completed_tasks / weekData.assigned_tasks) * 100)
    : 0;

  const chartData = [
    {
      name: 'Assigned',
      value: weekData.assigned_tasks,
      fill: 'hsl(var(--muted))'
    },
    {
      name: 'Completed',
      value: weekData.completed_tasks,
      fill: 'hsl(var(--primary))'
    },
    {
      name: 'Pending',
      value: pendingTasks,
      fill: 'hsl(var(--warning))'
    },
    {
      name: 'Overdue',
      value: weekData.overdue_tasks,
      fill: 'hsl(var(--destructive))'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Tasks</p>
                <p className="text-2xl font-bold text-foreground">{weekData.assigned_tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{weekData.completed_tasks}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {completionRate}% rate
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{weekData.overdue_tasks}</p>
                {weekData.assigned_tasks > 0 && (
                  <Badge 
                    variant={weekData.overdue_tasks > weekData.assigned_tasks * 0.1 ? "destructive" : "secondary"}
                    className="text-xs mt-1"
                  >
                    {Math.round((weekData.overdue_tasks / weekData.assigned_tasks) * 100)}% of total
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Velocity</p>
                <p className="text-2xl font-bold text-foreground">{weekData.completion_velocity}%</p>
                <Badge 
                  variant={weekData.completion_velocity >= 80 ? "default" : "secondary"}
                  className="text-xs mt-1"
                >
                  {weekData.completion_velocity >= 80 ? 'Excellent' : 
                   weekData.completion_velocity >= 60 ? 'Good' : 'Needs Focus'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>

            {/* Progress Breakdown */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Tasks</span>
                  <Badge variant="default">{weekData.completed_tasks}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Tasks</span>
                  <Badge variant="secondary">{pendingTasks}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue Tasks</span>
                  <Badge variant="destructive">{weekData.overdue_tasks}</Badge>
                </div>
              </div>

              {/* Performance Insight */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Weekly Insight</h4>
                <p className="text-sm text-muted-foreground">
                  {completionRate >= 80 
                    ? "Excellent performance! You're maintaining a strong completion rate."
                    : completionRate >= 60
                    ? "Good progress. Consider focusing on reducing overdue tasks."
                    : "Focus needed. Review task prioritization and time management."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};