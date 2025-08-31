import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useTeamAnalytics, TeamAnalytics } from '@/hooks/team/useTeamAnalytics';

interface TeamAnalyticsDashboardProps {
  teamAnalytics?: TeamAnalytics | null;
  isLoading?: boolean;
}

const TeamAnalyticsDashboard: React.FC<TeamAnalyticsDashboardProps> = ({
  teamAnalytics,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-shimmer">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-muted rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!teamAnalytics) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
        <p className="text-muted-foreground">Select a team to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Team Size */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl text-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{teamAnalytics.memberCount}</span>
                <span className="text-sm text-muted-foreground pb-1">active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl text-accent">
                <Target className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="text-accent border-accent/30">
                +5%
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Completion Rate</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{teamAnalytics.averageCompletionRate}%</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Progress value={teamAnalytics.averageCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Team Velocity */}
        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl text-warning">
                <TrendingUp className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="text-warning border-warning/30">
                +12%
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Velocity</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{teamAnalytics.performanceMetrics.teamVelocity}</span>
                <span className="text-sm text-muted-foreground pb-1">tasks/week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              {teamAnalytics.overdueTasks > 0 && (
                <Badge variant="destructive">
                  {teamAnalytics.overdueTasks}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Overdue Tasks</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{teamAnalytics.overdueTasks}</span>
                <span className="text-sm text-muted-foreground pb-1">need attention</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Top Performers
            </CardTitle>
            <CardDescription>Team members leading in completion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamAnalytics.performanceMetrics.topPerformer && (
              <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div>
                  <p className="font-medium">{teamAnalytics.performanceMetrics.topPerformer.name}</p>
                  <p className="text-sm text-muted-foreground">Top Performer</p>
                </div>
                <Badge className="bg-accent text-accent-foreground">
                  {teamAnalytics.performanceMetrics.topPerformer.completionRate}%
                </Badge>
              </div>
            )}
            
            {teamAnalytics.performanceMetrics.mostActive && (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <p className="font-medium">{teamAnalytics.performanceMetrics.mostActive.name}</p>
                  <p className="text-sm text-muted-foreground">Most Active</p>
                </div>
                <Badge variant="outline" className="border-primary text-primary">
                  {teamAnalytics.performanceMetrics.mostActive.totalTasks} tasks
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>Task allocation across team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamAnalytics.workloadDistribution.map((member) => (
              <div key={member.memberId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{member.memberName}</span>
                  <span className="text-sm text-muted-foreground">
                    {member.taskCount} tasks ({member.workloadPercentage}%)
                  </span>
                </div>
                <Progress value={member.workloadPercentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Overview</CardTitle>
          <CardDescription>Current status of all team tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{teamAnalytics.completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{teamAnalytics.inProgressTasks}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {teamAnalytics.totalTasks - teamAnalytics.completedTasks - teamAnalytics.inProgressTasks}
              </div>
              <div className="text-sm text-muted-foreground">To Do</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAnalyticsDashboard;