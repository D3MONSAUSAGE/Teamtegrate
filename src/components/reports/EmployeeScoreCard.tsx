import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, Target, Zap } from 'lucide-react';
import type { EmployeePerformance } from '@/hooks/useEmployeePerformance';

interface EmployeeScoreCardProps {
  performance: EmployeePerformance;
}

export const EmployeeScoreCard: React.FC<EmployeeScoreCardProps> = ({ performance }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 75) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 60) return { label: 'Average', variant: 'outline' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  const badge = getScoreBadge(performance.total_score);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{performance.user_name}</CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className={`text-5xl font-bold ${getScoreColor(performance.total_score)}`}>
            {performance.total_score}
          </div>
          <p className="text-sm text-muted-foreground">Overall Performance Score</p>
          <Progress value={performance.total_score} className="h-2" />
        </div>

        {/* Metrics Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Completion Rate</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{performance.completion_rate}%</span>
              <Progress value={performance.completion_rate} className="h-1 w-16" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Velocity</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{performance.velocity}</span>
              <span className="text-xs text-muted-foreground">tasks/day</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Quality</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{performance.quality_score}%</span>
              <Progress value={performance.quality_score} className="h-1 w-16" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Consistency</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{performance.consistency_score}%</span>
              <Progress value={performance.consistency_score} className="h-1 w-16" />
            </div>
          </div>
        </div>

        {/* Task Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{performance.completed_tasks}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{performance.completed_on_time}</div>
              <div className="text-xs text-muted-foreground">On Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{performance.overdue_tasks}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
