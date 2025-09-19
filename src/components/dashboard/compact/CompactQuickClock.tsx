import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed, 
  Play, 
  Pause,
  Loader2
} from 'lucide-react';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';

const CompactQuickClock: React.FC = () => {
  const {
    sessionState,
    breakRequirements,
    isLoading,
    clockIn,
    clockOut,
    startBreak,
    resumeWork
  } = useEnhancedTimeTracking();

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentStatus = () => {
    if (sessionState.isOnBreak) {
      return {
        status: 'On Break',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        time: formatTime(sessionState.breakElapsedMinutes),
        icon: Pause
      };
    } else if (sessionState.isActive) {
      return {
        status: 'Working',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        time: formatTime(sessionState.workElapsedMinutes),
        icon: Play
      };
    } else {
      return {
        status: 'Clocked Out',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        time: '00:00',
        icon: Clock
      };
    }
  };

  const status = getCurrentStatus();
  const StatusIcon = status.icon;
  
  // Calculate daily progress (8 hours = 480 minutes)
  const dailyTarget = 480; // 8 hours
  const totalWorked = sessionState.totalWorkedToday + sessionState.workElapsedMinutes;
  const progressPercentage = Math.min((totalWorked / dailyTarget) * 100, 100);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Quick Clock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className={`p-3 rounded-lg ${status.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className="text-sm font-medium">{status.status}</span>
            </div>
            {breakRequirements.requiresMealBreak && (
              <Badge variant="destructive" className="text-xs">
                Meal Break
              </Badge>
            )}
          </div>
          <div className="text-xl font-mono font-bold text-center">
            {status.time}
          </div>
        </div>

        {/* Daily Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Daily Progress</span>
            <span>{formatHoursMinutes(totalWorked)} / 8h</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Main Action */}
        <div className="space-y-2">
          {sessionState.isOnBreak ? (
            <Button
              onClick={resumeWork}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Resume Work
            </Button>
          ) : sessionState.isActive ? (
            <Button
              variant="destructive"
              onClick={() => clockOut('')}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TimerOff className="h-4 w-4" />
              )}
              Clock Out
            </Button>
          ) : (
            <Button
              onClick={() => clockIn('')}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              Clock In
            </Button>
          )}

          {/* Break Buttons - Only when working */}
          {sessionState.isActive && (
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startBreak('Coffee')}
                disabled={isLoading || !breakRequirements.canTakeBreak}
                className="text-xs"
              >
                <Coffee className="h-3 w-3" />
              </Button>
              <Button
                variant={breakRequirements.requiresMealBreak ? "default" : "outline"}
                size="sm"
                onClick={() => startBreak('Lunch')}
                disabled={isLoading || !breakRequirements.canTakeBreak}
                className="text-xs"
              >
                <UtensilsCrossed className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
          <div className="flex justify-between">
            <span>Work:</span>
            <span className="text-green-600">{formatHoursMinutes(sessionState.totalWorkedToday + sessionState.workElapsedMinutes)}</span>
          </div>
          <div className="flex justify-between">
            <span>Break:</span>
            <span className="text-orange-600">{formatHoursMinutes(sessionState.totalBreakToday + sessionState.breakElapsedMinutes)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactQuickClock;