import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Clock, Users, TrendingDown } from 'lucide-react';

interface TaskBottlenecksChartProps {
  data: Array<{
    title: string;
    category: string;
    averageCompletionDays: number;
    completionRate: number;
    stuckCount: number;
  }>;
}

export const TaskBottlenecksChart: React.FC<TaskBottlenecksChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>No bottleneck data available</p>
            <p className="text-sm mt-2">This is good - no tasks are causing significant delays!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'hr_documentation': 'bg-blue-100 text-blue-800',
      'compliance_training': 'bg-green-100 text-green-800',
      'job_specific_training': 'bg-purple-100 text-purple-800',
      'culture_engagement': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getBottleneckSeverity = (completionRate: number, stuckCount: number) => {
    if (completionRate < 50 || stuckCount > 5) return { label: 'Critical', variant: 'destructive' as const };
    if (completionRate < 70 || stuckCount > 2) return { label: 'High', variant: 'secondary' as const };
    return { label: 'Medium', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      {/* Bottlenecks Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Task Bottlenecks Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((task, index) => {
              const severity = getBottleneckSeverity(task.completionRate, task.stuckCount);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getCategoryColor(task.category)}>
                        {task.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant={severity.variant}>
                        {severity.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingDown className="h-4 w-4" />
                        <span>{task.completionRate}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{task.averageCompletionDays}d</span>
                      </div>
                      <p className="text-xs text-muted-foreground">avg time</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-red-600">
                        <Users className="h-4 w-4" />
                        <span>{task.stuckCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">stuck</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate vs Average Days Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Task Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="title" type="category" width={200} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completionRate' ? `${value}%` : `${value} days`,
                  name === 'completionRate' ? 'Completion Rate' : 'Avg Completion Days'
                ]}
              />
              <Bar dataKey="completionRate" fill="#0088FE" name="Completion Rate (%)" />
              <Bar dataKey="averageCompletionDays" fill="#00C49F" name="Avg Days" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 3).map((task, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <h5 className="font-medium text-sm">{task.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">
                  {task.completionRate < 50 
                    ? "Consider breaking this task into smaller steps or providing additional resources."
                    : task.stuckCount > 2
                    ? "Review task dependencies and ensure required resources are available."
                    : "Monitor closely and consider streamlining the process."
                  }
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};