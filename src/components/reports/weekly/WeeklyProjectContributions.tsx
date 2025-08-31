import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FolderOpen, Target, CheckCircle } from 'lucide-react';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { DailyCompletionChart } from './DailyCompletionChart';
import { format, subDays } from 'date-fns';

interface ProjectContribution {
  project_title: string;
  task_count: number;
  completed_count: number;
}

interface WeeklyProjectContributionsProps {
  contributions: ProjectContribution[] | null;
  isLoading: boolean;
}

export const WeeklyProjectContributions: React.FC<WeeklyProjectContributionsProps> = ({ 
  contributions, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Project Contributions</CardTitle>
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

  if (!contributions || contributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Project Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No project contributions found for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process data for visualization
  const processedData = contributions.map(contrib => {
    const taskCount = Number(contrib.task_count) || 0;
    const completedCount = Number(contrib.completed_count) || 0;
    const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
    
    return {
      name: contrib.project_title || 'Untitled Project',
      total: taskCount,
      completed: completedCount,
      remaining: taskCount - completedCount,
      completionRate
    };
  }).filter(item => item.total > 0); // Filter out projects with no tasks

  // Calculate summary metrics
  const totalTasks = processedData.reduce((sum, project) => sum + project.total, 0);
  const totalCompleted = processedData.reduce((sum, project) => sum + project.completed, 0);
  const overallCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const activeProjects = processedData.length;
  const completedProjects = processedData.filter(p => p.completionRate === 100).length;

  // Sort projects by completion rate for better visualization
  const sortedData = [...processedData].sort((a, b) => b.completionRate - a.completionRate);

  // Generate mock daily completion data for charts (in real app, this would come from the API)
  const dailyCompletionData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Mock data based on project contributions
      const dailyCompleted = Math.floor(Math.random() * 5) + 1;
      const dailyTotal = dailyCompleted + Math.floor(Math.random() * 3);
      
      data.push({
        date: dateStr,
        completed: dailyCompleted,
        total: dailyTotal
      });
    }
    return data;
  }, [contributions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{activeProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
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
                <p className="text-sm text-muted-foreground">Overall Rate</p>
                <p className="text-2xl font-bold">{overallCompletionRate}%</p>
              </div>
              <Badge variant={overallCompletionRate >= 80 ? 'default' : overallCompletionRate >= 60 ? 'secondary' : 'destructive'}>
                {overallCompletionRate >= 80 ? 'Excellent' : overallCompletionRate >= 60 ? 'Good' : 'Needs Focus'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Contributions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Project Task Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} layout="horizontal">
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'completed' ? 'Completed Tasks' : 'Remaining Tasks'
                  ]}
                />
                <Bar dataKey="completed" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyTrendChart data={dailyCompletionData} isLoading={isLoading} />
        <DailyCompletionChart data={dailyCompletionData} isLoading={isLoading} />
      </div>

      {/* Project Details List */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedData.map((project, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium truncate">{project.name}</h4>
                <Badge variant={project.completionRate === 100 ? 'default' : 'outline'}>
                  {project.completionRate}% Complete
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{project.completed} of {project.total} tasks completed</span>
                  <span>{project.remaining} remaining</span>
                </div>
                <Progress value={project.completionRate} className="h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};