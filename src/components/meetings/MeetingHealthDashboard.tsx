import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target,
  Zap,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingHealthMetrics {
  effectiveness_score: number;
  engagement_score: number;
  completion_rate: number;
  follow_through_rate: number;
  participant_satisfaction_avg: number;
  roi_score: number;
  time_efficiency_score: number;
  total_participants: number;
  active_participants: number;
  meeting_duration_minutes: number;
  actual_vs_planned_ratio: number;
  action_items_created: number;
  action_items_completed: number;
  goals_set: number;
  goals_achieved: number;
  cost_estimate: number;
}

interface MeetingHealthDashboardProps {
  metrics: MeetingHealthMetrics;
  meetingTitle?: string;
  className?: string;
}

export const MeetingHealthDashboard: React.FC<MeetingHealthDashboardProps> = ({
  metrics,
  meetingTitle,
  className
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' };
    return { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: Award, color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', icon: CheckCircle, color: 'text-yellow-600' };
    if (score >= 40) return { label: 'Fair', icon: AlertCircle, color: 'text-orange-600' };
    return { label: 'Needs Improvement', icon: AlertCircle, color: 'text-red-600' };
  };

  const overallScore = Math.round((
    metrics.effectiveness_score +
    metrics.engagement_score +
    metrics.time_efficiency_score +
    (metrics.participant_satisfaction_avg * 20)
  ) / 4);

  const healthStatus = getHealthStatus(overallScore);
  const HealthIcon = healthStatus.icon;

  const participationRate = metrics.total_participants > 0 
    ? Math.round((metrics.active_participants / metrics.total_participants) * 100) 
    : 0;

  const actionItemCompletionRate = metrics.action_items_created > 0
    ? Math.round((metrics.action_items_completed / metrics.action_items_created) * 100)
    : 0;

  const goalCompletionRate = metrics.goals_set > 0
    ? Math.round((metrics.goals_achieved / metrics.goals_set) * 100)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Meeting Health Dashboard
          </CardTitle>
          {meetingTitle && (
            <Badge variant="outline" className="text-sm">
              {meetingTitle}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Health Score */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className={cn(
              "p-3 rounded-full",
              getScoreColor(overallScore).bg,
              getScoreColor(overallScore).border,
              "border-2"
            )}>
              <HealthIcon className={cn("h-8 w-8", healthStatus.color)} />
            </div>
            <div>
              <div className="text-3xl font-bold">{overallScore}%</div>
              <div className={cn("text-sm font-medium", healthStatus.color)}>
                {healthStatus.label}
              </div>
            </div>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Effectiveness Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Effectiveness</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.effectiveness_score}%</span>
                <Badge className={cn(getScoreColor(metrics.effectiveness_score).text)}>
                  {metrics.effectiveness_score >= 70 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
              <Progress value={metrics.effectiveness_score} className="h-1" />
            </div>
          </div>

          {/* Engagement Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Engagement</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.engagement_score}%</span>
                <Badge className={cn(getScoreColor(metrics.engagement_score).text)}>
                  {metrics.engagement_score >= 70 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
              <Progress value={metrics.engagement_score} className="h-1" />
            </div>
          </div>

          {/* Time Efficiency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Time Use</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.time_efficiency_score}%</span>
                <Badge className={cn(getScoreColor(metrics.time_efficiency_score).text)}>
                  {metrics.actual_vs_planned_ratio <= 1.1 ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                </Badge>
              </div>
              <Progress value={metrics.time_efficiency_score} className="h-1" />
              <div className="text-xs text-muted-foreground">
                {metrics.actual_vs_planned_ratio.toFixed(1)}x planned time
              </div>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Satisfaction</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{metrics.participant_satisfaction_avg.toFixed(1)}/5</span>
                <Badge className={cn(getScoreColor(metrics.participant_satisfaction_avg * 20).text)}>
                  {metrics.participant_satisfaction_avg >= 4 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </Badge>
              </div>
              <Progress value={metrics.participant_satisfaction_avg * 20} className="h-1" />
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Participation Metrics */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Participation</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Participants</span>
                  <span className="font-medium">{metrics.active_participants}/{metrics.total_participants}</span>
                </div>
                <Progress value={participationRate} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {participationRate}% participation rate
                </div>
              </div>
            </div>
          </Card>

          {/* Action Items */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Action Items</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">{metrics.action_items_completed}/{metrics.action_items_created}</span>
                </div>
                <Progress value={actionItemCompletionRate} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {actionItemCompletionRate}% completion rate
                </div>
              </div>
            </div>
          </Card>

          {/* Goals Achievement */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Goals</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Achieved</span>
                  <span className="font-medium">{metrics.goals_achieved}/{metrics.goals_set}</span>
                </div>
                <Progress value={goalCompletionRate} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {goalCompletionRate}% goal completion
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ROI and Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">ROI Analysis</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{metrics.roi_score}%</div>
                  <div className="text-sm text-muted-foreground">Return on Investment</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">${metrics.cost_estimate.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
              </div>
              
              <Progress value={Math.min(metrics.roi_score, 100)} className="h-2" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Meeting Stats</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold">{metrics.meeting_duration_minutes}min</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{metrics.completion_rate.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Completion</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Smart Recommendations</span>
            </div>
            
            <div className="space-y-2 text-sm">
              {overallScore < 70 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Overall Performance:</strong> Consider shortening meeting duration and improving agenda structure to boost effectiveness.
                  </div>
                </div>
              )}
              
              {participationRate < 70 && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Low Participation:</strong> Try interactive elements, smaller groups, or clearer agenda items to increase engagement.
                  </div>
                </div>
              )}
              
              {actionItemCompletionRate < 50 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Action Items:</strong> Improve follow-up by assigning clearer ownership and deadlines.
                  </div>
                </div>
              )}
              
              {metrics.roi_score > 80 && (
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Great ROI:</strong> This meeting format is working well! Consider using it as a template for similar meetings.
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};