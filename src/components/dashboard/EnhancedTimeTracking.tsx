
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed, 
  Play, 
  Pause,
  Loader2,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

const EnhancedTimeTracking: React.FC = () => {
  const {
    sessionState,
    breakRequirements,
    isLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    resumeWork
  } = useEnhancedTimeTracking();
  
  const [notes, setNotes] = useState('');

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentStateInfo = () => {
    if (sessionState.isOnBreak) {
      return {
        status: 'On Break',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: Pause,
        description: `${sessionState.breakType} break in progress`,
        time: formatTime(sessionState.breakElapsedMinutes)
      };
    } else if (sessionState.isActive) {
      return {
        status: 'Working',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: Play,
        description: 'Active work session',
        time: formatTime(sessionState.workElapsedMinutes)
      };
    } else {
      return {
        status: 'Clocked Out',
        color: 'bg-gray-500',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: Clock,
        description: 'Not currently tracking time',
        time: '00:00'
      };
    }
  };

  const stateInfo = getCurrentStateInfo();
  const StatusIcon = stateInfo.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Time Tracking Card */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Display */}
            {lastError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">{lastError}</span>
              </div>
            )}

            {/* Current Status */}
            <div className={cn("p-4 rounded-lg border", stateInfo.bgColor, stateInfo.borderColor)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full animate-pulse", stateInfo.color)} />
                  <div>
                    <div className="font-semibold text-lg">{stateInfo.status}</div>
                    <div className="text-sm text-muted-foreground">{stateInfo.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold">{stateInfo.time}</div>
                  {sessionState.isActive && (
                    <div className="text-xs text-muted-foreground">
                      {formatHoursMinutes(sessionState.workElapsedMinutes)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Notes */}
            <div>
              <Input
                placeholder="Add notes for your session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Main Action Button */}
            <div className="flex flex-col gap-3">
              {sessionState.isOnBreak ? (
                <Button
                  onClick={resumeWork}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Resume Work
                </Button>
              ) : sessionState.isActive ? (
                <Button
                  variant="destructive"
                  onClick={() => clockOut(notes)}
                  disabled={isLoading}
                  size="lg"
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
                  onClick={() => clockIn(notes)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-emerald-500"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  Clock In
                </Button>
              )}

              {/* Break Controls - Always visible when working */}
              {sessionState.isActive && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Take a Break</span>
                    {breakRequirements.requiresMealBreak && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Meal Break Required
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Coffee break clicked, canTakeBreak:', breakRequirements.canTakeBreak);
                        startBreak('Coffee');
                      }}
                      disabled={isLoading || !breakRequirements.canTakeBreak}
                      className="justify-start"
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Coffee (10 min)
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Rest break clicked, canTakeBreak:', breakRequirements.canTakeBreak);
                        startBreak('Rest');
                      }}
                      disabled={isLoading || !breakRequirements.canTakeBreak}
                      className="justify-start"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Rest (10 min)
                    </Button>
                    
                    <Button
                      variant={breakRequirements.requiresMealBreak ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        console.log('Lunch break clicked, canTakeBreak:', breakRequirements.canTakeBreak);
                        startBreak('Lunch');
                      }}
                      disabled={isLoading || !breakRequirements.canTakeBreak}
                      className="justify-start"
                    >
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
                      Lunch (30 min)
                    </Button>
                  </div>

                  {/* Break Requirements Debug Info */}
                  <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                    {breakRequirements.complianceMessage && (
                      <div className="mb-1">{breakRequirements.complianceMessage}</div>
                    )}
                    <div>
                      Break Status: {breakRequirements.canTakeBreak ? '✅ Available' : '❌ Not Available'} | 
                      Total Work: {sessionState.totalWorkedToday + sessionState.workElapsedMinutes} min | 
                      Break Time: {sessionState.totalBreakToday} min
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary Card */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work Time */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg dark:bg-green-950/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium">Work Time</span>
              </div>
              <span className="font-bold text-green-600">
                {formatHoursMinutes(sessionState.totalWorkedToday + sessionState.workElapsedMinutes)}
              </span>
            </div>

            {/* Break Time */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="font-medium">Break Time</span>
              </div>
              <span className="font-bold text-orange-600">
                {formatHoursMinutes(sessionState.totalBreakToday + sessionState.breakElapsedMinutes)}
              </span>
            </div>

            {/* Current Session */}
            {(sessionState.isActive || sessionState.isOnBreak) && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span className="font-medium">Current Session</span>
                </div>
                <span className="font-bold text-blue-600">
                  {formatTime(sessionState.isActive ? sessionState.workElapsedMinutes : sessionState.breakElapsedMinutes)}
                </span>
              </div>
            )}

            {/* Compliance Status */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Compliance Status</div>
              <div className="flex items-center gap-2">
                {breakRequirements.requiresMealBreak ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-xs">
                  {breakRequirements.requiresMealBreak 
                    ? 'Meal break required' 
                    : 'Break requirements met'
                  }
                </span>
              </div>
            </div>

            {/* Labor Law Info */}
            <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
              <strong>CA Labor Law:</strong> 30-min meal break after 5 hours. 
              10-min rest break per 4 hours worked.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedTimeTracking;
