
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTask } from '@/contexts/task';
import ProjectProgressChart from './analytics/ProjectProgressChart';
import TeamPerformanceChart from './analytics/TeamPerformanceChart';
import CompletionRateChart from './analytics/CompletionRateChart';

const AnalyticsSection = () => {
  const { projects, tasks } = useTask();

  const completedTasksCount = tasks.filter(task => task.status === 'Completed').length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Task completion status across projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectProgressChart projects={projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Task assignment and completion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamPerformanceChart tasks={tasks} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion Trends</CardTitle>
          <CardDescription>Task completion rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <CompletionRateChart tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSection;
