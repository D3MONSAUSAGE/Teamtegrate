
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed, 
  Play, 
  Pause,
  Loader2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

const CompactEnhancedTimeWidget: React.FC = () => {
  const {
    sessionState,
    breakRequirements,
    isLoading,
    lastError,
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

  const getCurrentStateColor = () => {
    if (sessionState.isOnBreak) return 'border-orange-300 bg-orange-50 dark:bg-orange-950/20';
    if (sessionState.isActive) return 'border-green-300 bg-green-50 dark:bg-green-950/20';
    return 'border-gray-300 bg-gray-50 dark:bg-gray-950/20';
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          Time Tracker
          {sessionState.isOnBreak && (
            <Badge variant="secondary" className="ml-auto animate-pulse">
              <Pause className="h-3 w-3 mr-1" />
              On Break
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            <span className="text-destructive truncate">{lastError}</span>
          </div>
        )}

        {/* Current Status Display */}
        <div className={cn("p-4 rounded-lg border transition-colors", getCurrentStateColor())}>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {sessionState.isActive || sessionState.isOnBreak ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              )}
              <span className="text-sm font-medium">
                {sessionState.isOnBreak ? `${sessionState.breakType} Break` : 
                 sessionState.isActive ? 'Working' : 'Idle'}
              </span>
            </div>
            
            <div className="text-2xl font-mono font-bold">
              {sessionState.isOnBreak 
                ? formatTime(sessionState.breakElapsedMinutes)
                : sessionState.isActive 
                ? formatTime(sessionState.workElapsedMinutes)
                : '00:00'
              }
            </div>
            
            {(sessionState.isActive || sessionState.isOnBreak) && (
              <div className="text-xs text-muted-foreground">
                {sessionState.isOnBreak 
                  ? `${sessionState.breakType} break elapsed`
                  : formatHoursMinutes(sessionState.workElapsedMinutes) + ' work time'
                }
              </div>
            )}
          </div>
        </div>

        {/* Main Action Button */}
        {sessionState.isOnBreak ? (
          <Button
            onClick={resumeWork}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Resume Work
          </Button>
        ) : sessionState.isActive ? (
          <Button
            variant="destructive"
            onClick={() => clockOut()}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TimerOff className="mr-2 h-4 w-4" />
            )}
            Clock Out
          </Button>
        ) : (
          <Button
            onClick={() => clockIn()}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-emerald-500"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Clock In
          </Button>
        )}

        {/* Break Controls - Compact version */}
        {sessionState.isActive && breakRequirements.canTakeBreak && (
          <div className="space-y-2">
            {breakRequirements.requiresMealBreak && (
              <Badge variant="destructive" className="w-full text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Meal Break Required
              </Badge>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startBreak('Coffee')}
                disabled={isLoading}
                className="text-xs"
              >
                <Coffee className="mr-1 h-3 w-3" />
                Coffee
              </Button>
              <Button
                variant={breakRequirements.requiresMealBreak ? "default" : "outline"}
                size="sm"
                onClick={() => startBreak('Lunch')}
                disabled={isLoading}
                className="text-xs"
              >
                <UtensilsCrossed className="mr-1 h-3 w-3" />
                Lunch
              </Button>
            </div>
          </div>
        )}

        {/* Daily Summary */}
        <div className="text-xs space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Today's Work:</span>
            <span className="font-medium text-green-600">
              {formatHoursMinutes(sessionState.totalWorkedToday + sessionState.workElapsedMinutes)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Break Time:</span>
            <span className="font-medium text-orange-600">
              {formatHoursMinutes(sessionState.totalBreakToday + sessionState.breakElapsedMinutes)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactEnhancedTimeWidget;
