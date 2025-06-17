
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
        action: () => resumeFromBreak(),
        actionLabel: 'Resume Work',
        actionIcon: Play
      };
    } else if (isActivelyWorking) {
      return {
        status: 'Working',
        time: elapsedTime,
        color: 'bg-green-500',
        action: () => clockOut(),
        actionLabel: 'Clock Out',
        actionIcon: TimerOff
      };
    } else {
      return {
        status: 'Clocked Out',
        time: '00:00:00',
        color: 'bg-gray-500',
        action: () => clockIn(),
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
    <Card className="bg-card/80 backdrop-blur-sm border shadow-lg rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
          <Timer className="h-6 w-6 text-primary" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-6">
        {/* Status Display */}
        <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 border">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full animate-pulse ${statusInfo.color}`} />
            <div>
              <div className="text-lg font-semibold text-foreground mb-1">{statusInfo.status}</div>
              <div className="text-3xl font-mono font-bold text-primary">{statusInfo.time}</div>
            </div>
          </div>
          
          {!isOnline && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              Offline
            </Badge>
          )}
        </div>

        {/* Main Controls */}
        <div className="space-y-4">
          <Button
            size="lg"
            onClick={statusInfo.action}
            disabled={isLoading || !isOnline}
            className={`w-full h-14 text-lg font-medium ${
              isOnBreak ? 'bg-green-600 hover:bg-green-700' :
              isActivelyWorking ? 'bg-red-600 hover:bg-red-700' :
              'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
            ) : (
              <ActionIcon className="h-6 w-6 mr-3" />
            )}
            {statusInfo.actionLabel}
          </Button>

          {/* Break Controls - Only show when actively working */}
          {isActivelyWorking && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCoffeeBreak}
                disabled={isLoading || !isOnline}
                className="h-12 text-base font-medium"
              >
                <Coffee className="h-5 w-5 mr-2" />
                Coffee Break
              </Button>
              <Button
                variant="outline"
                onClick={handleLunchBreak}
                disabled={isLoading || !isOnline}
                className="h-12 text-base font-medium"
              >
                <UtensilsCrossed className="h-5 w-5 mr-2" />
                Lunch Break
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTimeTracking;
