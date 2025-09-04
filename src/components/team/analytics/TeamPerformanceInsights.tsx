import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap
} from 'lucide-react';
import { TeamAnalytics } from '@/hooks/team/useTeamAnalytics';

interface TeamPerformanceInsightsProps {
  analytics: TeamAnalytics;
}

const TeamPerformanceInsights: React.FC<TeamPerformanceInsightsProps> = ({ analytics }) => {
  // Calculate insights
  const recentTrend = analytics.productivityTrend.slice(-2);
  const isImproving = recentTrend.length === 2 && 
    recentTrend[1].completed > recentTrend[0].completed;
  
  const completionRate = analytics.totalTasks > 0 
    ? (analytics.completedTasks / analytics.totalTasks) * 100 
    : 0;
    
  const averageWorkload = analytics.workloadDistribution.length > 0
    ? analytics.workloadDistribution.reduce((sum, member) => sum + member.workloadPercentage, 0) / analytics.workloadDistribution.length
    : 0;
    
  const workloadBalance = Math.max(...analytics.workloadDistribution.map(m => m.workloadPercentage)) -
    Math.min(...analytics.workloadDistribution.map(m => m.workloadPercentage));

  // Generate insights
  const insights = [
    {
      type: isImproving ? 'positive' : 'neutral',
      icon: isImproving ? TrendingUp : TrendingDown,
      title: 'Productivity Trend',
      description: isImproving 
        ? 'Team productivity is trending upward this period'
        : 'Team productivity needs attention',
      metric: `${recentTrend.length === 2 ? 
        Math.round(((recentTrend[1].completed - recentTrend[0].completed) / Math.max(recentTrend[0].completed, 1)) * 100)
        : 0}%`,
      recommendation: isImproving 
        ? 'Continue current practices and consider scaling successful strategies'
        : 'Review current processes and identify blockers affecting team performance'
    },
    {
      type: completionRate >= 80 ? 'positive' : completionRate >= 60 ? 'warning' : 'negative',
      icon: completionRate >= 80 ? CheckCircle : completionRate >= 60 ? Clock : AlertCircle,
      title: 'Task Completion Health',
      description: `Team is completing ${completionRate.toFixed(0)}% of assigned tasks`,
      metric: `${completionRate.toFixed(0)}%`,
      recommendation: completionRate >= 80 
        ? 'Excellent completion rate. Consider taking on more challenging projects'
        : completionRate >= 60
        ? 'Good completion rate. Focus on removing blockers to improve further'
        : 'Low completion rate. Immediate attention needed to identify and resolve issues'
    },
    {
      type: workloadBalance <= 30 ? 'positive' : workloadBalance <= 50 ? 'warning' : 'negative',
      icon: workloadBalance <= 30 ? Users : AlertCircle,
      title: 'Workload Distribution',
      description: `${workloadBalance.toFixed(0)}% difference between highest and lowest workloads`,
      metric: `${workloadBalance.toFixed(0)}%`,
      recommendation: workloadBalance <= 30
        ? 'Good workload balance across team members'
        : 'Consider redistributing tasks to balance workload more evenly'
    },
    {
      type: analytics.performanceMetrics.teamVelocity >= 10 ? 'positive' : 
            analytics.performanceMetrics.teamVelocity >= 5 ? 'warning' : 'negative',
      icon: analytics.performanceMetrics.teamVelocity >= 10 ? Zap : 
            analytics.performanceMetrics.teamVelocity >= 5 ? Target : Clock,
      title: 'Team Velocity',
      description: `Current velocity of ${analytics.performanceMetrics.teamVelocity} tasks per week`,
      metric: `${analytics.performanceMetrics.teamVelocity}/week`,
      recommendation: analytics.performanceMetrics.teamVelocity >= 10
        ? 'High velocity team. Ensure quality is maintained alongside pace'
        : analytics.performanceMetrics.teamVelocity >= 5
        ? 'Moderate velocity. Look for opportunities to streamline processes'
        : 'Low velocity. Investigate bottlenecks and resource constraints'
    }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10';
      case 'warning': return 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10';
      case 'negative': return 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10';
      default: return 'border-muted/20';
    }
  };

  const getInsightBadge = (type: string) => {
    switch (type) {
      case 'positive': return <Badge className="bg-accent text-accent-foreground">Good</Badge>;
      case 'warning': return <Badge variant="outline" className="border-warning text-warning">Watch</Badge>;
      case 'negative': return <Badge variant="destructive">Action Needed</Badge>;
      default: return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Insights</h3>
          <p className="text-sm text-muted-foreground">AI-powered recommendations for team optimization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <Card key={index} className={getInsightColor(insight.type)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'positive' ? 'bg-accent/10' :
                      insight.type === 'warning' ? 'bg-warning/10' :
                      insight.type === 'negative' ? 'bg-destructive/10' : 'bg-muted/10'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        insight.type === 'positive' ? 'text-accent' :
                        insight.type === 'warning' ? 'text-warning' :
                        insight.type === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  {getInsightBadge(insight.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  <span className="text-xl font-bold">{insight.metric}</span>
                </div>
                
                <div className="p-3 bg-background/50 rounded-lg border">
                  <p className="text-sm font-medium mb-1">Recommendation:</p>
                  <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.overdueTasks > 0 && (
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm">Address Overdue Tasks</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.overdueTasks} tasks need immediate attention
                </p>
              </div>
            )}
            
            {workloadBalance > 50 && (
              <div className="p-4 border border-warning/20 rounded-lg bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">Balance Workload</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Redistribute tasks for better team balance
                </p>
              </div>
            )}
            
            {analytics.performanceMetrics.teamVelocity < 5 && (
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Boost Velocity</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Identify and remove process bottlenecks
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPerformanceInsights;