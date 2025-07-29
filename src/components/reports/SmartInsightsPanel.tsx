import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, TrendingUp, AlertTriangle, Target, Users, Clock, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartInsightsPanelProps {
  teamData: {
    totalTasks: number;
    completedTasks: number;
    teamMembers: number;
    averageCompletionRate: number;
    overdueTasks: number;
    highPriorityTasks: number;
  };
  performanceData: Array<{
    name: string;
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
  }>;
}

const SmartInsightsPanel: React.FC<SmartInsightsPanelProps> = ({
  teamData,
  performanceData
}) => {
  const insights = useMemo(() => {
    const insights: Array<{
      type: 'success' | 'warning' | 'info' | 'destructive';
      icon: React.ComponentType<any>;
      title: string;
      description: string;
      actionable?: string;
      priority: number;
    }> = [];

    // Performance Analysis
    const completionRate = teamData.totalTasks > 0 ? (teamData.completedTasks / teamData.totalTasks) * 100 : 0;
    
    if (completionRate >= 85) {
      insights.push({
        type: 'success',
        icon: Award,
        title: 'Excellent Team Performance',
        description: `Your team is performing exceptionally well with ${completionRate.toFixed(1)}% task completion rate.`,
        actionable: 'Consider setting more challenging goals or expanding project scope.',
        priority: 1
      });
    } else if (completionRate < 60) {
      insights.push({
        type: 'destructive',
        icon: AlertTriangle,
        title: 'Performance Needs Attention',
        description: `Team completion rate is ${completionRate.toFixed(1)}%, below optimal levels.`,
        actionable: 'Review task allocation and identify blockers with underperforming members.',
        priority: 3
      });
    }

    // Workload Distribution
    const topPerformer = performanceData.reduce((prev, curr) => 
      curr.completionRate > prev.completionRate ? curr : prev, performanceData[0]);
    const bottomPerformer = performanceData.reduce((prev, curr) => 
      curr.completionRate < prev.completionRate ? curr : prev, performanceData[0]);

    if (topPerformer && bottomPerformer && topPerformer.completionRate - bottomPerformer.completionRate > 40) {
      insights.push({
        type: 'warning',
        icon: Users,
        title: 'Uneven Performance Distribution',
        description: `Large gap between top performer (${topPerformer.completionRate}%) and lowest (${bottomPerformer.completionRate}%).`,
        actionable: 'Consider mentoring programs or task redistribution.',
        priority: 2
      });
    }

    // Task Overload Detection
    const overloadedMembers = performanceData.filter(member => member.totalTasks > 20 && member.completionRate < 70);
    if (overloadedMembers.length > 0) {
      insights.push({
        type: 'warning',
        icon: Clock,
        title: 'Potential Team Overload',
        description: `${overloadedMembers.length} team member(s) may be overloaded with tasks.`,
        actionable: 'Review workload distribution and consider task reallocation.',
        priority: 2
      });
    }

    // High Priority Tasks Alert
    if (teamData.highPriorityTasks > 5) {
      insights.push({
        type: 'info',
        icon: Target,
        title: 'High Priority Tasks',
        description: `${teamData.highPriorityTasks} high-priority tasks require attention.`,
        actionable: 'Focus resources on critical deliverables.',
        priority: 2
      });
    }

    // Productivity Opportunities
    const avgTasksPerMember = teamData.totalTasks / teamData.teamMembers;
    if (avgTasksPerMember < 5) {
      insights.push({
        type: 'info',
        icon: Zap,
        title: 'Capacity Available',
        description: `Team has capacity for more work (${avgTasksPerMember.toFixed(1)} tasks per member).`,
        actionable: 'Consider taking on additional projects or initiatives.',
        priority: 1
      });
    }

    // Overdue Tasks Warning
    if (teamData.overdueTasks > 0) {
      insights.push({
        type: 'destructive',
        icon: AlertTriangle,
        title: 'Overdue Tasks Alert',
        description: `${teamData.overdueTasks} tasks are past their deadline.`,
        actionable: 'Prioritize overdue items and review project timelines.',
        priority: 3
      });
    }

    // Team Size Insights
    if (teamData.teamMembers < 3 && teamData.totalTasks > 30) {
      insights.push({
        type: 'warning',
        icon: Users,
        title: 'Consider Team Expansion',
        description: 'High task volume relative to team size may impact quality and deadlines.',
        actionable: 'Evaluate hiring needs or task prioritization.',
        priority: 2
      });
    }

    return insights.sort((a, b) => b.priority - a.priority);
  }, [teamData, performanceData]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      case 'destructive': return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'destructive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Smart Insights & Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered analysis of your team's performance and actionable recommendations
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No specific insights available at the moment.</p>
              <p className="text-sm">Your team is performing well overall!</p>
            </div>
          ) : (
            insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-200 hover:shadow-md",
                    getInsightColor(insight.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-white/50", getIconColor(insight.type))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Priority {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <div className="p-3 bg-white/50 rounded-md border-l-2 border-primary">
                          <p className="text-sm font-medium text-primary">
                            💡 Recommendation: {insight.actionable}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartInsightsPanel;