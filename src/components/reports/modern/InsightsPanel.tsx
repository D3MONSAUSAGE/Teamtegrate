import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightItem {
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  metric?: string;
}

interface InsightsPanelProps {
  taskStats?: {
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
  };
  hoursStats?: {
    total_hours: number;
    avg_daily_hours: number;
    overtime_hours: number;
  };
  contributions?: Array<{
    project_title: string;
    task_count: number;
    completion_rate: number;
  }>;
  isLoading?: boolean;
}

const InsightCard: React.FC<{ insight: InsightItem; index: number }> = ({ insight, index }) => {
  const typeStyles = {
    success: 'border-accent/20 bg-accent/5 text-accent',
    warning: 'border-warning/20 bg-warning/5 text-warning',
    info: 'border-primary/20 bg-primary/5 text-primary',
    achievement: 'border-accent/20 bg-gradient-to-r from-accent/10 to-primary/10 text-accent'
  };

  return (
    <Card 
      className={cn(
        "border-2 transition-all duration-300 hover:shadow-md animate-slide-up",
        typeStyles[insight.type]
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {insight.icon}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              {insight.metric && (
                <Badge variant="secondary" className="text-xs">
                  {insight.metric}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
            {insight.action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={insight.action.onClick}
                className="p-0 h-auto text-xs hover:no-underline"
              >
                {insight.action.label}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  taskStats,
  hoursStats,
  contributions,
  isLoading
}) => {
  const generateInsights = (): InsightItem[] => {
    const insights: InsightItem[] = [];
    
    // Task completion insights
    if (taskStats) {
      if (taskStats.completion_rate > 90) {
        insights.push({
          type: 'achievement',
          title: 'Excellent Performance!',
          description: 'You\'ve maintained a 90%+ completion rate. Keep up the outstanding work!',
          icon: <Award className="h-4 w-4" />,
          metric: `${Math.round(taskStats.completion_rate)}%`
        });
      } else if (taskStats.completion_rate < 50) {
        insights.push({
          type: 'warning',
          title: 'Room for Improvement',
          description: 'Your completion rate could be higher. Consider reviewing task priorities.',
          icon: <AlertTriangle className="h-4 w-4" />,
          metric: `${Math.round(taskStats.completion_rate)}%`,
          action: {
            label: 'Review Tasks',
            onClick: () => console.log('Navigate to tasks')
          }
        });
      } else if (taskStats.completion_rate > 75) {
        insights.push({
          type: 'success',
          title: 'Strong Performance',
          description: 'You\'re completing most of your tasks on time. Great consistency!',
          icon: <CheckCircle2 className="h-4 w-4" />,
          metric: `${Math.round(taskStats.completion_rate)}%`
        });
      }
    }

    // Hours insights
    if (hoursStats) {
      if (hoursStats.overtime_hours > 5) {
        insights.push({
          type: 'warning',
          title: 'Work-Life Balance Alert',
          description: `You've worked ${hoursStats.overtime_hours}h overtime this week. Consider delegating tasks.`,
          icon: <Clock className="h-4 w-4" />,
          metric: `${hoursStats.overtime_hours}h OT`
        });
      } else if (hoursStats.total_hours < 30) {
        insights.push({
          type: 'info',
          title: 'Light Workload',
          description: 'You have capacity for additional tasks this week.',
          icon: <Target className="h-4 w-4" />,
          metric: `${Math.round(hoursStats.total_hours)}h`
        });
      }
    }

    // Project insights
    if (contributions && contributions.length > 3) {
      insights.push({
        type: 'warning',
        title: 'Multi-Project Load',
        description: `You're active on ${contributions.length} projects. Consider focusing efforts for better efficiency.`,
        icon: <TrendingUp className="h-4 w-4" />,
        metric: `${contributions.length} projects`
      });
    }

    // Trend insights (mock data)
    const isImproving = Math.random() > 0.5;
    if (isImproving) {
      insights.push({
        type: 'success',
        title: 'Upward Trend',
        description: 'Your productivity has increased by 15% compared to last week.',
        icon: <TrendingUp className="h-4 w-4" />,
        metric: '+15%'
      });
    }

    // Best day insight (mock)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const bestDay = days[Math.floor(Math.random() * days.length)];
    insights.push({
      type: 'info',
      title: 'Peak Performance Day',
      description: `${bestDay} is your most productive day. Schedule important tasks then.`,
      icon: <Lightbulb className="h-4 w-4" />
    });

    return insights;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const insights = generateInsights();

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <span>AI Insights & Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} index={index} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No insights available yet.</p>
            <p className="text-sm">Complete more tasks to get personalized recommendations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};