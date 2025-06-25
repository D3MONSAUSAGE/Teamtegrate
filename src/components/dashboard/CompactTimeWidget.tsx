
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';

const CompactTimeWidget: React.FC = () => {
  const {
    currentEntry,
    isLoading,
    lastError,
    isOnline,
    clockIn,
    clockOut,
    startBreak,
    forceRefresh
  } = useTimeTracking();

  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Calculate elapsed time if clocked in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentEntry?.isClocked && currentEntry?.clock_in) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentEntry.clock_in!.getTime()) / 60000);
        setElapsedMinutes(elapsed);
      }, 1000);
    } else {
      setElapsedMinutes(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentEntry?.isClocked, currentEntry?.clock_in]);

  const formatElapsedTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    try {
      await clockIn();
    } catch (error) {
      console.error('Clock in failed:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
    } catch (error) {
      console.error('Clock out failed:', error);
    }
  };

  const handleBreak = async (breakType: string) => {
    try {
      await startBreak(breakType);
    } catch (error) {
      console.error('Start break failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4 space-y-3">
        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            <span className="text-destructive truncate">{lastError}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={forceRefresh}
              className="h-5 w-5 p-0 ml-auto flex-shrink-0"
            >
              ↻
            </Button>
          </div>
        )}

        {/* Status Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {currentEntry?.isClocked ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
            <span className="text-sm font-medium">
              {currentEntry?.isClocked ? 'Active' : 'Inactive'}
            </span>
            {!isOnline && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                Offline
              </span>
            )}
          </div>
          
          <div className="text-2xl font-mono font-bold">
            {formatElapsedTime(elapsedMinutes)}
          </div>
          
          {currentEntry?.isClocked && elapsedMinutes > 0 && (
            <div className="text-xs text-muted-foreground">
              {formatHoursMinutes(elapsedMinutes)} elapsed
            </div>
          )}
        </div>

        {/* Main Action */}
        {currentEntry?.isClocked ? (
          <Button
            variant="destructive"
            onClick={handleClockOut}
            disabled={isLoading || !isOnline}
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
            onClick={handleClockIn}
            disabled={isLoading || !isOnline}
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

        {/* Break Options */}
        {currentEntry?.isClocked && elapsedMinutes > 60 && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBreak('Coffee')}
              disabled={isLoading || !isOnline}
              className="text-xs"
            >
              <Coffee className="mr-1 h-3 w-3" />
              Break
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBreak('Lunch')}
              disabled={isLoading || !isOnline}
              className="text-xs"
            >
              <UtensilsCrossed className="mr-1 h-3 w-3" />
              Lunch
            </Button>
          </div>
        )}

        {/* Quick Info */}
        {currentEntry?.isClocked && currentEntry?.clock_in && (
          <div className="text-xs text-center text-muted-foreground border-t pt-2">
            Started at {currentEntry.clock_in.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactTimeWidget;
