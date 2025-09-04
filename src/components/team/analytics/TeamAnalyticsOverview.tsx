import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  Activity,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useTeamAnalytics } from '@/hooks/team/useTeamAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TeamAnalyticsOverviewProps {
  teamId: string;
}

type TimePeriod = 'week' | 'month' | 'quarter';

const TeamAnalyticsOverview: React.FC<TeamAnalyticsOverviewProps> = ({ teamId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const { analytics, isLoading, error } = useTeamAnalytics(teamId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
        <p className="text-muted-foreground">Unable to load team analytics data</p>
      </div>
    );
  }

  const completionRate = analytics.totalTasks > 0 
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
    : 0;

  const productivityTrendData = analytics.productivityTrend.map((trend, index) => ({
    ...trend,
    efficiency: trend.assigned > 0 ? Math.round((trend.completed / trend.assigned) * 100) : 0,
    weekLabel: `W${index + 1}`
  }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Analytics</h3>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'quarter'] as TimePeriod[]).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Team Size & Growth */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline" className="text-primary border-primary/30">
                Active
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{analytics.memberCount}</span>
                <span className="text-sm text-muted-foreground pb-1">members</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <Badge 
                variant={completionRate >= 80 ? "default" : completionRate >= 60 ? "secondary" : "destructive"}
                className={completionRate >= 80 ? "bg-accent text-accent-foreground" : ""}
              >
                {completionRate >= 80 ? "Excellent" : completionRate >= 60 ? "Good" : "Needs Focus"}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{completionRate}%</span>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Team Velocity */}
        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <Badge variant="outline" className="text-warning border-warning/30">
                {analytics.performanceMetrics.teamVelocity > 5 ? "+High" : "Normal"}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Team Velocity</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{analytics.performanceMetrics.teamVelocity}</span>
                <span className="text-sm text-muted-foreground pb-1">tasks/week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks Alert */}
        <Card className={analytics.overdueTasks > 0 ? "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10" : "border-muted/20"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${analytics.overdueTasks > 0 ? "bg-destructive/10" : "bg-muted/10"}`}>
                <AlertTriangle className={`h-6 w-6 ${analytics.overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              {analytics.overdueTasks > 0 && (
                <Badge variant="destructive">
                  Attention Needed
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Overdue Tasks</h3>
              <div className="flex items-end space-x-2">
                <span className="text-3xl font-bold tracking-tight">{analytics.overdueTasks}</span>
                <span className="text-sm text-muted-foreground pb-1">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Productivity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityTrendData}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                <XAxis 
                  dataKey="weekLabel" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.period}</p>
                          <div className="space-y-1 mt-2">
                            <p className="text-sm">
                              <span className="text-primary">●</span> Completed: {data.completed}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">●</span> Assigned: {data.assigned}
                            </p>
                            <p className="text-sm">
                              <span className="text-accent">●</span> Efficiency: {data.efficiency}%
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="assigned"
                  stackId="1"
                  stroke="hsl(var(--muted-foreground))"
                  fill="url(#assignedGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="url(#completedGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Team Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.performanceMetrics.topPerformer && (
              <div className="flex items-center justify-between p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-full">
                    <Target className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{analytics.performanceMetrics.topPerformer.name}</p>
                    <p className="text-sm text-muted-foreground">Top Performer</p>
                  </div>
                </div>
                <Badge className="bg-accent text-accent-foreground">
                  {analytics.performanceMetrics.topPerformer.completionRate}%
                </Badge>
              </div>
            )}
            
            {analytics.performanceMetrics.mostActive && (
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{analytics.performanceMetrics.mostActive.name}</p>
                    <p className="text-sm text-muted-foreground">Most Active</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary text-primary">
                  {analytics.performanceMetrics.mostActive.totalTasks} tasks
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Workload Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.workloadDistribution.slice(0, 5).map((member) => (
              <div key={member.memberId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{member.memberName}</span>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {member.taskCount} ({member.workloadPercentage}%)
                  </span>
                </div>
                <Progress 
                  value={member.workloadPercentage} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamAnalyticsOverview;