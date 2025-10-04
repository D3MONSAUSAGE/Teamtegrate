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
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

const StreamlinedTimeControls: React.FC = () => {
  const { 
    sessionState, 
    breakRequirements,
    clockIn, 
    clockOut, 
    startBreak, 
    resumeWork,
    isLoading,
    lastError
  } = useEnhancedTimeTracking();

  const isWorking = sessionState.isActive && !sessionState.isOnBreak;
  const isOnBreak = sessionState.isActive && sessionState.isOnBreak;
  const canTakeBreak = isWorking && breakRequirements.canTakeBreak;

  const [qrDialogOpen, setQRDialogOpen] = useState(false);
  const [qrTokenType, setQRTokenType] = useState<'clock_in' | 'clock_out'>('clock_in');

  const openQRDialog = (type: 'clock_in' | 'clock_out') => {
    setQRTokenType(type);
    setQRDialogOpen(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className={cn(
                "w-4 h-4 rounded-full",
                isWorking ? "bg-green-500 animate-pulse" :
                isOnBreak ? "bg-orange-500 animate-pulse" :
                "bg-muted-foreground"
              )} />
              
              {/* Status Text */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {isWorking ? "Working" : 
                     isOnBreak ? "On Break" : 
                     "Ready to Clock In"}
                  </span>
                  {isWorking && (
                    <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      {formatHoursMinutes(sessionState.workElapsedMinutes)}
                    </Badge>
                  )}
                  {isOnBreak && (
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                      {formatHoursMinutes(sessionState.breakElapsedMinutes)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Today: {formatHoursMinutes(sessionState.totalWorkedToday)} worked • {formatHoursMinutes(sessionState.totalBreakToday)} breaks
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {lastError ? (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Connected</span>
                </div>
              )}
            </div>
          </div>

          <Separator orientation="vertical" className="h-12" />

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Break Requirements Alert */}
            {canTakeBreak && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Break Available</span>
              </div>
            )}

            {/* Break Buttons */}
            {isWorking && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startBreak('Coffee')}
                  disabled={isLoading}
                  className="gap-2 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950"
                >
                  <Coffee className="h-4 w-4" />
                  Coffee Break
                </Button>
                
                {breakRequirements.requiresMealBreak && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startBreak('Lunch')}
                    disabled={isLoading}
                    className="gap-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950"
                  >
                    <Utensils className="h-4 w-4" />
                    Lunch Break
                  </Button>
                )}
              </>
            )}

            {/* Main Action Button */}
            {!sessionState.isActive ? (
              <Button
                onClick={() => openQRDialog('clock_in')}
                disabled={isLoading}
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white min-w-[180px]"
              >
                <QrCode className="h-4 w-4" />
                Generate Clock In QR
              </Button>
            ) : isOnBreak ? (
              <Button
                onClick={resumeWork}
                disabled={isLoading}
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 min-w-[180px]"
              >
                <Play className="h-4 w-4" />
                Resume Work
              </Button>
            ) : (
              <Button
                onClick={() => openQRDialog('clock_out')}
                disabled={isLoading}
                variant="destructive"
                size="lg"
                className="gap-2 min-w-[180px]"
              >
                <QrCode className="h-4 w-4" />
                Generate Clock Out QR
              </Button>
            )}
          </div>
        </div>

        {/* Break Requirements Footer */}
        {(breakRequirements.canTakeBreak || breakRequirements.requiresMealBreak) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              CA Labor Law Requirements:
            </div>
            <div className="flex items-center gap-4 text-xs">
              {breakRequirements.canTakeBreak && (
                <span className="text-muted-foreground">
                  Break available now
                </span>
              )}
              {breakRequirements.requiresMealBreak && (
                <span className="text-muted-foreground">
                  Meal break required (30min)
                </span>
              )}
              {breakRequirements.complianceMessage && (
                <span className="text-amber-600 dark:text-amber-400">
                  {breakRequirements.complianceMessage}
                </span>
              )}
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