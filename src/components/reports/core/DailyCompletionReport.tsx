import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DailyCompletionData {
  date: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

interface DailyCompletionReportProps {
  data: DailyCompletionData[];
  isLoading: boolean;
}

export const DailyCompletionReport: React.FC<DailyCompletionReportProps> = ({
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

  // Calculate summary metrics
  const totalTasks = data.reduce((sum, day) => sum + day.total_tasks, 0);
  const totalCompleted = data.reduce((sum, day) => sum + day.completed_tasks, 0);
  const avgCompletionRate = data.length > 0 
    ? Math.round(data.reduce((sum, day) => sum + day.completion_rate, 0) / data.length)
    : 0;
  const bestDay = data.reduce((best, day) => 
    day.completion_rate > best.completion_rate ? day : best, 
    { completion_rate: 0, date: '' }
  );

  // Prepare chart data
  const chartData = data.map(day => ({
    ...day,
    date: format(parseISO(day.date), 'MM/dd'),
    pending: day.total_tasks - day.completed_tasks
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold text-foreground">{avgCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Day</p>
                <p className="text-lg font-bold text-foreground">
                  {bestDay.date ? format(parseISO(bestDay.date), 'MMM dd') : 'N/A'}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {bestDay.completion_rate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Task Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Task Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'completed_tasks' ? 'Completed' : 'Pending'
                  ]}
                />
                <Bar dataKey="completed_tasks" fill="hsl(var(--primary))" name="completed_tasks" />
                <Bar dataKey="pending" fill="hsl(var(--muted))" name="pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>High Priority</span>
                    <span className="font-medium">
                      {data.reduce((sum, day) => sum + day.high_priority, 0)} tasks
                    </span>
                  </div>
                  <Progress 
                    value={(data.reduce((sum, day) => sum + day.high_priority, 0) / totalTasks) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Medium Priority</span>
                    <span className="font-medium">
                      {data.reduce((sum, day) => sum + day.medium_priority, 0)} tasks
                    </span>
                  </div>
                  <Progress 
                    value={(data.reduce((sum, day) => sum + day.medium_priority, 0) / totalTasks) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Low Priority</span>
                    <span className="font-medium">
                      {data.reduce((sum, day) => sum + day.low_priority, 0)} tasks
                    </span>
                  </div>
                  <Progress 
                    value={(data.reduce((sum, day) => sum + day.low_priority, 0) / totalTasks) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};