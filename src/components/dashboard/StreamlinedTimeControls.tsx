import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Coffee, 
  Utensils, 
  Wifi,
  WifiOff,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { EmployeeQRGenerator } from '@/components/attendance/EmployeeQRGenerator';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { formatTimeWithSeconds } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

const StreamlinedTimeControls: React.FC = () => {
  const { 
    currentSession,
    isLoading,
    lastError,
    startBreak
  } = useTimeTracking();

  const isWorking = currentSession.isActive && !currentSession.isOnBreak;
  const isOnBreak = currentSession.isActive && currentSession.isOnBreak;
  const canTakeBreak = isWorking && currentSession.elapsedMinutes > 240; // Can take break after 4 hours

  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrTokenType, setQRTokenType] = useState<'clock_in' | 'clock_out'>('clock_in');

  const openQRDialog = (type: 'clock_in' | 'clock_out') => {
    setQRTokenType(type);
    setQRDialogOpen(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Status Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              {/* Status Indicator */}
              <div className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0",
                isWorking ? "bg-green-500 animate-pulse" :
                isOnBreak ? "bg-orange-500 animate-pulse" :
                "bg-muted-foreground"
              )} />
              
              {/* Status Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm sm:text-base md:text-lg">
                    {isWorking ? "Working" : 
                     isOnBreak ? "On Break" : 
                     "Ready to Clock In"}
                  </span>
                  {isWorking && (
                    <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                      {formatTimeWithSeconds(currentSession.elapsedSeconds)}
                    </Badge>
                  )}
                  {isOnBreak && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs">
                      {formatTimeWithSeconds(currentSession.breakElapsedSeconds)}
                    </Badge>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {currentSession.clockInTime && (
                    <>Clocked in: {new Date(currentSession.clockInTime).toLocaleTimeString()}</>
                  )}
                  {isOnBreak && currentSession.breakType && (
                    <> • {currentSession.breakType} break</>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {lastError ? (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs hidden sm:inline">Offline</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs hidden sm:inline">Connected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator orientation="horizontal" className="lg:hidden" />
          <Separator orientation="vertical" className="h-12 hidden lg:block" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {/* Break Requirements Alert */}
            {canTakeBreak && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 justify-center sm:justify-start">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium">Break Available</span>
              </div>
            )}

            {/* Break Buttons */}
            {isWorking && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startBreak('Coffee')}
                  disabled={isLoading}
                  className="gap-1 sm:gap-2 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Coffee className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Coffee Break</span>
                  <span className="sm:hidden">Coffee</span>
                </Button>
                
                {currentSession.elapsedMinutes > 300 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startBreak('Lunch')}
                    disabled={isLoading}
                    className="gap-1 sm:gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Lunch Break</span>
                    <span className="sm:hidden">Lunch</span>
                  </Button>
                )}
              </div>
            )}

            {/* Main Action Button */}
            {!currentSession.isActive ? (
              <Button
                onClick={() => openQRDialog('clock_in')}
                disabled={isLoading}
                size="default"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto sm:min-w-[180px] text-sm"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Clock In QR</span>
                <span className="sm:hidden">Clock In QR</span>
              </Button>
            ) : isOnBreak ? (
              <Button
                onClick={() => openQRDialog('clock_in')}
                disabled={isLoading}
                size="default"
                className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto sm:min-w-[180px] text-sm"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Clock In QR</span>
                <span className="sm:hidden">Clock In QR</span>
              </Button>
            ) : (
              <Button
                onClick={() => openQRDialog('clock_out')}
                disabled={isLoading}
                variant="destructive"
                size="default"
                className="gap-2 w-full sm:w-auto sm:min-w-[180px] text-sm"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Generate Clock Out QR</span>
                <span className="sm:hidden">Clock Out QR</span>
              </Button>
            )}
          </div>
        </div>

        {/* Break Requirements Footer */}
        {canTakeBreak && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              CA Labor Law Requirements:
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-amber-600 dark:text-amber-400">
                Break available after 4 hours of work
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* QR Code Generator Dialog */}
      <EmployeeQRGenerator
        open={qrDialogOpen}
        onOpenChange={setQRDialogOpen}
        tokenType={qrTokenType}
      />
    </Card>
  );
};

export default StreamlinedTimeControls;