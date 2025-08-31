import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
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

const CompactTimeControls: React.FC = () => {
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
    <Card className="w-full h-fit">
      <CardContent className="p-4 space-y-3">
        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            <span className="text-destructive truncate">{lastError}</span>
          </div>
        )}

        {/* Current Status Display - More Compact */}
        <div className={cn("p-3 rounded-lg border transition-colors", getCurrentStateColor())}>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              {sessionState.isActive || sessionState.isOnBreak ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              )}
              <span className="text-xs font-medium">
                {sessionState.isOnBreak ? `${sessionState.breakType} Break` : 
                 sessionState.isActive ? 'Working' : 'Ready to Clock In'}
              </span>
              {sessionState.isOnBreak && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  <Pause className="h-2 w-2 mr-1" />
                  Break
                </Badge>
              )}
            </div>
            
            <div className="text-xl font-mono font-bold">
              {sessionState.isOnBreak 
                ? formatTime(sessionState.breakElapsedMinutes)
                : sessionState.isActive 
                ? formatTime(sessionState.workElapsedMinutes)
                : '00:00'
              }
            </div>
          </div>
        </div>

        {/* Main Action Button - More Compact */}
        {sessionState.isOnBreak ? (
          <Button
            onClick={resumeWork}
            disabled={isLoading}
            className="w-full h-9 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm"
          >
            {isLoading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Play className="mr-1 h-3 w-3" />
            )}
            Resume Work
          </Button>
        ) : sessionState.isActive ? (
          <Button
            variant="destructive"
            onClick={() => clockOut()}
            disabled={isLoading}
            className="w-full h-9 text-sm"
          >
            {isLoading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <TimerOff className="mr-1 h-3 w-3" />
            )}
            Clock Out
          </Button>
        ) : (
          <Button
            onClick={() => clockIn()}
            disabled={isLoading}
            className="w-full h-9 bg-gradient-to-r from-primary to-emerald-500 text-sm"
          >
            {isLoading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Clock className="mr-1 h-3 w-3" />
            )}
            Clock In
          </Button>
        )}

        {/* Break Controls - Even More Compact */}
        {sessionState.isActive && (
          <div className="space-y-2">
            {breakRequirements.requiresMealBreak && (
              <Badge variant="destructive" className="w-full text-xs py-1">
                <AlertCircle className="h-2 w-2 mr-1" />
                Meal Break Required
              </Badge>
            )}
            
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startBreak('Coffee')}
                disabled={isLoading || !breakRequirements.canTakeBreak}
                className="text-xs h-8"
              >
                <Coffee className="mr-1 h-2 w-2" />
                Coffee
              </Button>
              <Button
                variant={breakRequirements.requiresMealBreak ? "default" : "outline"}
                size="sm"
                onClick={() => startBreak('Lunch')}
                disabled={isLoading || !breakRequirements.canTakeBreak}
                className="text-xs h-8"
              >
                <UtensilsCrossed className="mr-1 h-2 w-2" />
                Lunch
              </Button>
            </div>
          </div>
        )}

        {/* Daily Summary - Compact */}
        <div className="text-xs space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Today:</span>
            <span className="font-medium text-green-600">
              {formatHoursMinutes(sessionState.totalWorkedToday + sessionState.workElapsedMinutes)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Breaks:</span>
            <span className="font-medium text-orange-600">
              {formatHoursMinutes(sessionState.totalBreakToday + sessionState.breakElapsedMinutes)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTimeControls;