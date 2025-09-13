import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeamChecklistExecutions } from '@/hooks/useChecklistExecutions';
import { ExecutionHeatMap } from './ExecutionHeatMap';
import { TeamPerformanceComparison } from './TeamPerformanceComparison';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';

export const DailyTeamDashboard: React.FC = () => {
  const { data: executions, isLoading } = useTeamChecklistExecutions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  const totalExecutions = executions?.length || 0;
  const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0;
  const completionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

  // Generate mock heat map data (in a real app, this would come from your API)
  const heatMapData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    completionRate: Math.random() * 100,
    totalTasks: Math.floor(Math.random() * 50) + 10,
    completedTasks: Math.floor(Math.random() * 40) + 5,
    teams: Math.floor(Math.random() * 10) + 1,
  }));

  // Generate mock team performance data
  const teamPerformanceData = [
    {
      teamName: 'Sales Team A',
      teamId: 'team-1',
      overallCompletion: 92.5,
      averageScore: 87.3,
      totalTasks: 45,
      completedTasks: 42,
      members: [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          completionRate: 95.2,
          tasksCompleted: 20,
          totalTasks: 21,
          score: 92.1,
          streak: 5,
          rank: 1,
        },
        {
          id: 'user-2',
          name: 'Bob Smith',
          completionRate: 89.8,
          tasksCompleted: 22,
          totalTasks: 24,
          score: 82.5,
          streak: 3,
          rank: 2,
        },
      ],
    },
    {
      teamName: 'Operations Team',
      teamId: 'team-2',
      overallCompletion: 88.1,
      averageScore: 84.7,
      totalTasks: 38,
      completedTasks: 33,
      members: [
        {
          id: 'user-3',
          name: 'Carol Wilson',
          completionRate: 91.3,
          tasksCompleted: 19,
          totalTasks: 19,
          score: 88.9,
          streak: 2,
          rank: 1,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedExecutions} of {totalExecutions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamPerformanceData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Teams with active checklists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teamPerformanceData.reduce((sum, team) => sum + team.averageScore, 0) / teamPerformanceData.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Organization average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Heat Map */}
      <ExecutionHeatMap data={heatMapData} />

      {/* Team Performance Comparison */}
      <TeamPerformanceComparison teams={teamPerformanceData} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executions?.slice(0, 10).map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{execution.checklist?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {execution.assigned_user?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      execution.status === 'completed' ? 'default' : 
                      execution.status === 'in_progress' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {execution.status}
                  </Badge>
                  <div className="text-sm font-medium">
                    Score: {execution.total_score.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};