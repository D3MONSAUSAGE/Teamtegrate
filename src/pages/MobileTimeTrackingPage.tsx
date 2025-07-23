
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play, Pause, Coffee, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MobileTimeTrackingPage = () => {
  const {
    currentEntry,
    elapsedTime,
    breakElapsedTime,
    breakState,
    clockIn,
    clockOut,
    handleBreak,
    resumeFromBreak,
    isLoading,
    isOnline
  } = useTimeTrackingPage();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6">
        {/* Connection Status */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Time Tracking Widget */}
        <MobileTimeTrackingWidget
          currentEntry={currentEntry}
          elapsedTime={elapsedTime}
          isOnBreak={breakState.isOnBreak}
          breakElapsedTime={breakElapsedTime}
          lastBreakType={breakState.breakType}
          onClockIn={clockIn}
          onClockOut={clockOut}
          onStartBreak={handleBreak}
          onResumeFromBreak={resumeFromBreak}
          isLoading={isLoading}
          isOnline={isOnline}
        />

        {/* Work Session Stats */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Today's Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(Number(elapsedTime) || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Work Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {formatTime(Number(breakElapsedTime) || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Break Time</div>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
              {currentEntry ? (
                breakState.isOnBreak ? (
                  <>
                    <Coffee className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">
                      On {breakState.breakType} Break
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Working</span>
                  </>
                )
              ) : (
                <>
                  <Pause className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Not clocked in</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Information */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">Break Requirements</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium">Daily Hours</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                On Track
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              All time tracking data is recorded for compliance purposes
            </div>
          </CardContent>
        </Card>

        {/* Bottom padding for tab bar */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default MobileTimeTrackingPage;
