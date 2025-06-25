
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import { AnalyticsData } from '@/hooks/useAdvancedAnalytics';

interface AnalyticsInsightsPanelProps {
  analytics: AnalyticsData;
}

const AnalyticsInsightsPanel: React.FC<AnalyticsInsightsPanelProps> = ({ analytics }) => {
  const insights = [
    {
      title: "Productivity Score",
      value: `${analytics.productivityScore}%`,
      trend: analytics.trends.efficiency,
      icon: Target,
      color: analytics.productivityScore >= 70 ? 'text-green-500' : 
             analytics.productivityScore >= 50 ? 'text-yellow-500' : 'text-red-500',
      bgColor: analytics.productivityScore >= 70 ? 'bg-green-50 dark:bg-green-950/20' : 
               analytics.productivityScore >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20'
    },
    {
      title: "Completion Rate",
      value: `${analytics.trends.completionRate.toFixed(1)}%`,
      trend: analytics.trends.completionRate,
      icon: CheckCircle,
      color: analytics.trends.completionRate >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: analytics.trends.completionRate >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
    },
    {
      title: "Task Velocity",
      value: analytics.trends.velocity.toFixed(1),
      trend: analytics.trends.velocity,
      icon: Zap,
      color: analytics.trends.velocity >= 0 ? 'text-blue-500' : 'text-orange-500',
      bgColor: analytics.trends.velocity >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-orange-50 dark:bg-orange-950/20'
    }
  ];

  const recommendations = [
    ...(analytics.productivityScore < 50 ? [{
      type: 'warning' as const,
      message: 'Your productivity score is below 50%. Consider reviewing task priorities and deadlines.',
      icon: AlertTriangle
    }] : []),
    ...(analytics.trends.completionRate < -10 ? [{
      type: 'warning' as const,
      message: 'Completion rate has decreased significantly. You may need to reassess your workload.',
      icon: TrendingDown
    }] : []),
    ...(analytics.trends.velocity < -2 ? [{
      type: 'info' as const,
      message: 'Task creation is outpacing completion. Focus on finishing existing tasks.',
      icon: AlertTriangle
    }] : []),
    ...(analytics.productivityScore >= 80 ? [{
      type: 'success' as const,
      message: 'Excellent productivity! Keep up the great work.',
      icon: TrendingUp
    }] : [])
  ];

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card key={index} className={insight.bgColor}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${insight.color}`} />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {insight.title}
                      </p>
                      <p className={`text-2xl font-bold ${insight.color}`}>
                        {insight.value}
                      </p>
                    </div>
                  </div>
                  <TrendIcon trend={insight.trend} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights and Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights & Recommendations</CardTitle>
            <CardDescription>
              AI-powered suggestions to improve your productivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Icon className={`h-5 w-5 mt-0.5 ${
                    rec.type === 'success' ? 'text-green-500' :
                    rec.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{rec.message}</p>
                  </div>
                  <Badge variant={
                    rec.type === 'success' ? 'default' :
                    rec.type === 'warning' ? 'destructive' :
                    'secondary'
                  } className="text-xs">
                    {rec.type}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsInsightsPanel;
