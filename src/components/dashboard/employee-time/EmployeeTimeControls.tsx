
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TimerOff, 
  Coffee, 
  UtensilsCrossed, 
  Play, 
  Pause,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CurrentSession } from '@/hooks/useEmployeeTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface EmployeeTimeControlsProps {
  currentSession: CurrentSession;
  onClockIn: (notes?: string) => void;
  onClockOut: (notes?: string) => void;
  onStartBreak: (breakType: 'Coffee' | 'Lunch' | 'Rest') => void;
  onEndBreak: () => void;
  isLoading: boolean;
}

const EmployeeTimeControls: React.FC<EmployeeTimeControlsProps> = ({
  currentSession,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  isLoading
}) => {
  const [notes, setNotes] = useState('');

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getSessionStatus = () => {
    if (currentSession.isOnBreak) {
      return {
        status: 'On Break',
        time: formatTime(currentSession.breakElapsedMinutes),
        color: 'bg-orange-500',
        icon: Pause,
        description: `${currentSession.breakType} break in progress`
      };
    } else if (currentSession.isActive) {
      return {
        status: 'Working',
        time: formatTime(currentSession.elapsedMinutes),
        color: 'bg-green-500',
        icon: Play,
        description: 'Active work session'
      };
    } else {
      return {
        status: 'Clocked Out',
        time: '00:00',
        color: 'bg-gray-500',
        icon: Clock,
        description: 'Not currently tracking time'
      };
    }
  };

  const sessionStatus = getSessionStatus();
  const StatusIcon = sessionStatus.icon;

  const canTakeBreak = currentSession.isActive && currentSession.elapsedMinutes >= 60; // Can take break after 1 hour
  const shouldTakeMealBreak = currentSession.elapsedMinutes >= 300; // Meal break after 5 hours

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          Time Tracking Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Display */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${sessionStatus.color}`} />
              <div>
                <div className="font-semibold text-lg">{sessionStatus.status}</div>
                <div className="text-sm text-muted-foreground">{sessionStatus.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">{sessionStatus.time}</div>
              {currentSession.isActive && (
                <div className="text-xs text-muted-foreground">
                  {formatHoursMinutes(currentSession.elapsedMinutes)}
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

        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {currentSession.isOnBreak ? (
            <Button
              onClick={onEndBreak}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              End {currentSession.breakType} Break
            </Button>
          ) : currentSession.isActive ? (
            <Button
              variant="destructive"
              onClick={() => onClockOut(notes)}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
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
              onClick={() => onClockIn(notes)}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-lime-500"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Clock In
            </Button>
          )}
        </div>

        {/* Break Controls */}
        {currentSession.isActive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Break Options</span>
              {shouldTakeMealBreak && (
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
                onClick={() => onStartBreak('Coffee')}
                disabled={isLoading || !canTakeBreak}
                className="justify-start"
              >
                <Coffee className="h-4 w-4 mr-2" />
                Coffee Break (10 min)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartBreak('Rest')}
                disabled={isLoading || !canTakeBreak}
                className="justify-start"
              >
                <Pause className="h-4 w-4 mr-2" />
                Rest Break (10 min)
              </Button>
              
              <Button
                variant={shouldTakeMealBreak ? "default" : "outline"}
                size="sm"
                onClick={() => onStartBreak('Lunch')}
                disabled={isLoading || !canTakeBreak}
                className="justify-start"
              >
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Lunch Break (30 min)
              </Button>
            </div>
            
            {!canTakeBreak && (
              <div className="text-xs text-muted-foreground">
                Work for at least 1 hour before taking a break
              </div>
            )}
          </div>
        )}

        {/* Session Limits Warning */}
        {currentSession.isActive && currentSession.elapsedMinutes > 480 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Long Session Alert: You've been working for over 8 hours
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeTimeControls;
