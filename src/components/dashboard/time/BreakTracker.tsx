
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, UtensilsCrossed, Clock, Play, Pause, WifiOff } from 'lucide-react';
import { calculateBreakRequirements } from '@/utils/breakTracking';
import { cn } from '@/lib/utils';

interface BreakTrackerProps {
  totalWorkedMinutes: number;
  onStartBreak: (breakType: string) => void;
  isOnBreak: boolean;
  lastBreakType?: string;
  breakStartTime?: Date;
  isOnline?: boolean;
  isActivelyWorking?: boolean;
}

const BreakTracker: React.FC<BreakTrackerProps> = ({
  totalWorkedMinutes,
  onStartBreak,
  isOnBreak,
  lastBreakType,
  breakStartTime,
  isOnline = true,
  isActivelyWorking = false
}) => {
  const [breakElapsed, setBreakElapsed] = useState('00:00');
  const { mealBreaks, restBreaks, earnedBreakMinutes } = calculateBreakRequirements(totalWorkedMinutes);

  // Track break duration if on break
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOnBreak && breakStartTime) {
      interval = setInterval(() => {
        const elapsed = Date.now() - breakStartTime.getTime();
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setBreakElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setBreakElapsed('00:00');
    }

    return () => clearInterval(interval);
  }, [isOnBreak, breakStartTime]);

  const getBreakStatus = () => {
    if (totalWorkedMinutes < 120) {
      return { status: 'not-eligible', message: 'Work 2+ hours to earn your first break' };
    }
    
    if (earnedBreakMinutes > 0) {
      return { status: 'earned', message: `You've earned ${earnedBreakMinutes} minutes of break time!` };
    }
    
    return { status: 'up-to-date', message: 'Break requirements met' };
  };

  const breakStatus = getBreakStatus();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Coffee className="h-5 w-5 text-orange-500" />
          Break Tracker
          {isOnBreak && (
            <Badge variant="secondary" className="ml-auto animate-pulse">
              <Pause className="h-3 w-3 mr-1" />
              On {lastBreakType} Break
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="outline" className="ml-auto">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Break Status */}
        <div className={cn(
          "p-3 rounded-lg border",
          breakStatus.status === 'earned' && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
          breakStatus.status === 'not-eligible' && "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
          breakStatus.status === 'up-to-date' && "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
        )}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{breakStatus.message}</span>
          </div>
        </div>

        {/* Current Break Timer */}
        {isOnBreak && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/20 dark:border-orange-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {breakElapsed}
              </div>
              <div className="text-sm text-orange-600/80 dark:text-orange-400/80">
                {lastBreakType} break in progress
              </div>
            </div>
          </div>
        )}

        {/* Break Requirements Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-lg font-semibold text-primary">{restBreaks}</div>
            <div className="text-xs text-muted-foreground">Rest Breaks</div>
            <div className="text-xs text-muted-foreground">(10 min each)</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-lg font-semibold text-primary">{mealBreaks}</div>
            <div className="text-xs text-muted-foreground">Meal Breaks</div>
            <div className="text-xs text-muted-foreground">(30 min each)</div>
          </div>
        </div>

        {/* Break Action Buttons - only show when actively working */}
        {isActivelyWorking && totalWorkedMinutes >= 120 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => onStartBreak('Coffee')}
              className="w-full justify-start"
              size="sm"
              disabled={!isOnline}
            >
              <Coffee className="h-4 w-4 mr-2" />
              Take Coffee Break (10 min)
              {!isOnline && <span className="ml-auto text-xs">(Offline)</span>}
            </Button>
            <Button
              variant="outline"
              onClick={() => onStartBreak('Lunch')}
              className="w-full justify-start"
              size="sm"
              disabled={!isOnline}
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Take Lunch Break (30 min)
              {!isOnline && <span className="ml-auto text-xs">(Offline)</span>}
            </Button>
          </div>
        )}

        {/* Status message when not actively working */}
        {!isActivelyWorking && !isOnBreak && (
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Clock in to start working and earn break time
            </p>
          </div>
        )}

        {/* Legal Compliance Note */}
        {totalWorkedMinutes > 300 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            <strong>CA Labor Law:</strong> 30-min meal break required after 5 hours. 
            10-min rest break per 4 hours worked.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreakTracker;
