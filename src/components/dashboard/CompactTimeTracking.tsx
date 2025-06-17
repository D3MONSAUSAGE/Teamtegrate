
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TimerOff, Coffee, UtensilsCrossed, Play, Loader2, Timer } from 'lucide-react';
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

  const handleCoffeeBreak = () => {
    handleBreak('Coffee');
  };

  const handleLunchBreak = () => {
    handleBreak('Lunch');
  };

  return (
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {/* Status Display */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${statusInfo.color}`} />
              <div>
                <div className="text-lg font-semibold text-foreground">{statusInfo.status}</div>
                <div className="text-2xl font-mono font-bold text-primary">{statusInfo.time}</div>
              </div>
            </div>
            
            {!isOnline && (
              <Badge variant="outline" className="text-xs">
                Offline
              </Badge>
            )}
          </div>

          {/* Main Controls */}
          <div className="space-y-3">
            <Button
              size="lg"
              onClick={statusInfo.action}
              disabled={isLoading || !isOnline}
              className={`w-full h-12 text-base font-medium ${
                isOnBreak ? 'bg-green-600 hover:bg-green-700' :
                isActivelyWorking ? 'bg-red-600 hover:bg-red-700' :
                'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ActionIcon className="h-5 w-5 mr-2" />
              )}
              {statusInfo.actionLabel}
            </Button>

            {/* Break Controls - Only show when actively working */}
            {isActivelyWorking && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCoffeeBreak}
                  disabled={isLoading || !isOnline}
                  className="h-10 text-sm"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Coffee Break
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLunchBreak}
                  disabled={isLoading || !isOnline}
                  className="h-10 text-sm"
                >
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Lunch Break
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTimeTracking;
