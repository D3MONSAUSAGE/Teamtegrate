import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChecklistExecution } from '@/types/checklist';
import { Clock, CheckCircle, Play, Lock, Timer, AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChecklistTimeStatusBadge from './ChecklistTimeStatusBadge';
import { TimeWindowStatus } from '@/utils/checklistTimeUtils';

interface MobileChecklistCardProps {
  execution: ChecklistExecution;
  timeStatus: TimeWindowStatus;
  canStart: boolean;
  reason?: string;
  onStart: () => void;
  isAdmin?: boolean;
}

export const MobileChecklistCard: React.FC<MobileChecklistCardProps> = ({
  execution,
  timeStatus,
  canStart,
  reason,
  onStart,
  isAdmin,
}) => {
  const getPriorityGradient = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'from-red-500 to-red-600';
      case 'high':
        return 'from-orange-500 to-orange-600';
      case 'medium':
        return 'from-yellow-500 to-yellow-600';
      case 'low':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-warning" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        "border-l-4 touch-manipulation",
        timeStatus?.isInWindow && "border-l-success shadow-success/20",
        !canStart && execution.status === 'pending' && "opacity-80"
      )}
    >
      {/* Priority gradient bar */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80",
          getPriorityGradient(execution.checklist?.priority || 'medium')
        )}
      />

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg truncate">
              {execution.checklist?.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {getStatusIcon(execution.status)}
              <span className="capitalize">{execution.status.replace('_', ' ')}</span>
            </div>
          </div>
          <Badge 
            variant="outline"
            className={cn(
              "shrink-0 capitalize",
              execution.checklist?.priority === 'critical' && "border-red-500 text-red-700",
              execution.checklist?.priority === 'high' && "border-orange-500 text-orange-700",
              execution.checklist?.priority === 'medium' && "border-yellow-500 text-yellow-700",
              execution.checklist?.priority === 'low' && "border-green-500 text-green-700"
            )}
          >
            {execution.checklist?.priority}
          </Badge>
        </div>

        {/* Description - Mobile optimized */}
        {execution.checklist?.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {execution.checklist.description}
          </p>
        )}

        {/* Time Window Badge */}
        {timeStatus && timeStatus.status !== 'no-window' && (
          <ChecklistTimeStatusBadge
            checklist={execution.checklist}
            executionDate={execution.execution_date}
            showCountdown={true}
            className="w-full"
          />
        )}

        {/* Assigned User (Admin View) */}
        {isAdmin && execution.assigned_user && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-2.5">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">
              {execution.assigned_user.name || execution.assigned_user.email}
            </span>
          </div>
        )}

        {/* Progress Bar - Mobile optimized */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{execution.execution_score}%</span>
          </div>
          <Progress 
            value={execution.execution_score} 
            className="h-2.5 touch-none"
          />
        </div>

        {/* Cutoff Warning */}
        {execution.checklist?.cutoff_time && timeStatus?.isInWindow && (
          <div className="flex items-center gap-2 text-xs bg-warning/10 text-warning-foreground rounded-lg p-2.5">
            <Timer className="h-4 w-4 shrink-0" />
            <span>Cutoff: {execution.checklist.cutoff_time}</span>
          </div>
        )}

        {/* Action Button - Mobile optimized */}
        <Button
          onClick={onStart}
          className={cn(
            "w-full h-12 text-base font-medium transition-all touch-manipulation",
            timeStatus?.isInWindow && execution.status === 'pending' && canStart && 
            "bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg active:scale-95"
          )}
          variant={execution.status === 'pending' && canStart ? 'default' : 'outline'}
          disabled={execution.status === 'verified' || (execution.status === 'pending' && !canStart)}
        >
          {execution.status === 'pending' && canStart && (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Checklist
            </>
          )}
          {execution.status === 'pending' && !canStart && (
            <>
              <Lock className="h-5 w-5 mr-2" />
              {timeStatus?.status === 'upcoming' ? 'Not Available Yet' : 'Time Expired'}
            </>
          )}
          {execution.status === 'in_progress' && (
            <>
              <Play className="h-5 w-5 mr-2" />
              Continue
            </>
          )}
          {execution.status === 'completed' && 'Review Checklist'}
          {execution.status === 'verified' && (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Verified
            </>
          )}
        </Button>

        {/* Restriction message */}
        {!canStart && reason && execution.status === 'pending' && (
          <p className="text-xs text-center text-muted-foreground italic px-2">
            {reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
};