
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TimerOff, Coffee, UtensilsCrossed, Play, Loader2 } from 'lucide-react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';

const CompactTimeTracking: React.FC = () => {
  const {
    elapsedTime,
    breakElapsedTime,
    currentEntry,
    breakState,
    handleBreak,
    resumeFromBreak,
    clockIn,
    clockOut,
    isLoading,
    isOnline
  } = useTimeTrackingPage();

  const isActivelyWorking = currentEntry.isClocked && !breakState.isOnBreak;
  const isOnBreak = breakState.isOnBreak;

  const getStatusDisplay = () => {
    if (isOnBreak) {
      return {
        status: `${breakState.breakType} Break`,
        time: breakElapsedTime,
        color: 'bg-orange-500',
        action: resumeFromBreak,
        actionLabel: 'Resume Work',
        actionIcon: Play
      };
    } else if (isActivelyWorking) {
      return {
        status: 'Working',
        time: elapsedTime,
        color: 'bg-green-500',
        action: clockOut,
        actionLabel: 'Clock Out',
        actionIcon: TimerOff
      };
    } else {
      return {
        status: 'Clocked Out',
        time: '00:00:00',
        color: 'bg-gray-500',
        action: clockIn,
        actionLabel: 'Clock In',
        actionIcon: Clock
      };
    }
  };

  const statusInfo = getStatusDisplay();
  const ActionIcon = statusInfo.actionIcon;

  return (
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-3 h-3 rounded-full animate-pulse ${statusInfo.color}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{statusInfo.status}</div>
              <div className="text-xs text-muted-foreground">{statusInfo.time}</div>
            </div>
          </div>

          {/* Main Action Button */}
          <Button
            size="sm"
            onClick={statusInfo.action}
            disabled={isLoading || !isOnline}
            className={`${
              isOnBreak ? 'bg-green-600 hover:bg-green-700' :
              isActivelyWorking ? 'bg-red-600 hover:bg-red-700' :
              'bg-primary hover:bg-primary/90'
            } min-w-[100px]`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ActionIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Break Controls - Only show when actively working */}
          {isActivelyWorking && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBreak('Coffee')}
                disabled={isLoading || !isOnline}
                className="p-2"
                title="Coffee Break"
              >
                <Coffee className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBreak('Lunch')}
                disabled={isLoading || !isOnline}
                className="p-2"
                title="Lunch Break"
              >
                <UtensilsCrossed className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Offline Indicator */}
          {!isOnline && (
            <Badge variant="outline" className="text-xs">
              Offline
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTimeTracking;
