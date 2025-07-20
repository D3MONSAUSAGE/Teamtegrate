
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Coffee, Clock } from 'lucide-react';
import CircularProgress from './CircularProgress';
import MobileBreakPanel from './MobileBreakPanel';
import { cn } from '@/lib/utils';

interface MobileTimeTrackingWidgetProps {
  currentEntry: {
    isClocked: boolean;
    clock_in?: Date;
    id?: string;
  };
  elapsedTime: string;
  isOnBreak: boolean;
  breakElapsedTime: string;
  lastBreakType?: string;
  onClockIn: () => void;
  onClockOut: () => void;
  onStartBreak: (breakType: string) => void;
  onResumeFromBreak?: () => void;
  isLoading?: boolean;
  isOnline?: boolean;
}

const MobileTimeTrackingWidget: React.FC<MobileTimeTrackingWidgetProps> = ({
  currentEntry,
  elapsedTime,
  isOnBreak,
  breakElapsedTime,
  lastBreakType,
  onClockIn,
  onClockOut,
  onStartBreak,
  onResumeFromBreak,
  isLoading = false,
  isOnline = true
}) => {
  const [showBreakPanel, setShowBreakPanel] = useState(false);

  // Parse elapsed time to calculate progress (assuming 8-hour work day)
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const elapsedMinutes = parseTimeToMinutes(elapsedTime);
  const progressPercentage = Math.min((elapsedMinutes / 480) * 100, 100); // 480 minutes = 8 hours

  const formatTimeDisplay = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return {
        primary: `${parts[0]}:${parts[1]}`,
        secondary: parts[2] ? `:${parts[2]}` : ''
      };
    }
    return { primary: timeStr, secondary: '' };
  };

  const timeDisplay = formatTimeDisplay(isOnBreak ? breakElapsedTime : elapsedTime);

  const getTimerVariant = () => {
    if (isOnBreak) return 'break';
    if (currentEntry.isClocked) return 'work';
    return 'default';
  };

  const getStatusText = () => {
    if (isOnBreak) return `${lastBreakType} Break`;
    if (currentEntry.isClocked) return 'Working';
    return 'Ready to Work';
  };

  const getStatusColor = () => {
    if (isOnBreak) return 'text-orange-600 dark:text-orange-400';
    if (currentEntry.isClocked) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
  };

  return (
    <>
      <Card className="w-full bg-gradient-to-br from-background via-background to-muted/20 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Circular Timer */}
            <div className="relative">
              <CircularProgress
                progress={isOnBreak ? 0 : progressPercentage}
                size={160}
                strokeWidth={12}
                variant={getTimerVariant()}
                animated={true}
                pulsing={currentEntry.isClocked && !isOnBreak}
                className="mb-2"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono">
                    {timeDisplay.primary}
                    <span className="text-lg opacity-70">{timeDisplay.secondary}</span>
                  </div>
                  <div className={cn("text-sm font-medium mt-1", getStatusColor())}>
                    {getStatusText()}
                  </div>
                </div>
              </CircularProgress>
              
              {/* Progress indicator */}
              {currentEntry.isClocked && !isOnBreak && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border">
                    <Clock className="h-3 w-3" />
                    {Math.round(progressPercentage)}% of day
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full">
              {isOnBreak ? (
                <Button
                  onClick={onResumeFromBreak}
                  disabled={isLoading || !isOnline}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Resume Work
                    </>
                  )}
                </Button>
              ) : currentEntry.isClocked ? (
                <>
                  <Button
                    onClick={() => setShowBreakPanel(true)}
                    disabled={isLoading || !isOnline}
                    variant="outline"
                    className="h-12 px-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/70 dark:hover:to-orange-800/70 transition-all duration-300"
                  >
                    <Coffee className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </Button>
                  
                  <Button
                    onClick={onClockOut}
                    disabled={isLoading || !isOnline}
                    className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Square className="h-5 w-5 mr-2" />
                        Clock Out
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onClockIn}
                  disabled={isLoading || !isOnline}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Working
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Connection status */}
            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Offline - Changes will sync when connected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Break Panel */}
      <MobileBreakPanel
        isOpen={showBreakPanel}
        onClose={() => setShowBreakPanel(false)}
        onStartBreak={(breakType) => {
          onStartBreak(breakType);
          setShowBreakPanel(false);
        }}
        isLoading={isLoading}
      />
    </>
  );
};

export default MobileTimeTrackingWidget;

