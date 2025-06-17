
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed,
  Loader2,
  AlertCircle,
  Play
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
    forceRefresh
  } = useTimeTracking();

  const [notes, setNotes] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Calculate elapsed time if clocked in
  React.useEffect(() => {
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

  const handleClockIn = async () => {
    try {
      await clockIn(notes);
      setNotes('');
    } catch (error) {
      console.error('Clock in failed:', error);
    }
  };

  const handleClockOut = async (breakType?: string) => {
    try {
      const clockOutNotes = breakType ? 
        `${breakType}${notes ? ` - ${notes}` : ''}` : 
        notes;
      await clockOut(clockOutNotes);
      setNotes('');
    } catch (error) {
      console.error('Clock out failed:', error);
    }
  };

  const formatElapsedTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Time Tracking
          {!isOnline && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900 dark:text-amber-200">
              Offline
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{lastError}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={forceRefresh}
              className="ml-auto h-6 px-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Current Status */}
        {currentEntry?.isClocked && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Active Session</span>
              </div>
              <div className="text-lg font-mono font-bold text-green-700 dark:text-green-300">
                {formatElapsedTime(elapsedMinutes)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatHoursMinutes(elapsedMinutes)} elapsed
            </div>
          </div>
        )}

        {/* Notes Input */}
        <Input
          placeholder="Add session notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          className="text-sm"
        />

        {/* Main Actions */}
        <div className="space-y-2">
          {currentEntry?.isClocked ? (
            <>
              {/* Clock Out Button */}
              <Button
                variant="destructive"
                onClick={() => handleClockOut()}
                disabled={isLoading || !isOnline}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TimerOff className="mr-2 h-4 w-4" />
                )}
                Clock Out
              </Button>

              {/* Break Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClockOut('Break')}
                  disabled={isLoading || !isOnline}
                  className="text-xs"
                >
                  <Coffee className="mr-1 h-3 w-3" />
                  Break
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClockOut('Lunch')}
                  disabled={isLoading || !isOnline}
                  className="text-xs"
                >
                  <UtensilsCrossed className="mr-1 h-3 w-3" />
                  Lunch
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleClockIn}
              disabled={isLoading || !isOnline}
              className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-lime-500"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Clock In
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {currentEntry?.isClocked && elapsedMinutes > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Session started at {currentEntry.clock_in ? 
              currentEntry.clock_in.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
              'Unknown'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactTimeWidget;
