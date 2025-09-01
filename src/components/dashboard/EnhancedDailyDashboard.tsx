import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Coffee, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Timer,
  Award
} from 'lucide-react';
import { useEnhancedTimeTracking } from '@/hooks/useEnhancedTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';

const EnhancedDailyDashboard: React.FC = () => {
  const { 
    sessionState, 
    todayEntries, 
    breakRequirements, 
    isLoading,
    lastError 
  } = useEnhancedTimeTracking();

  // Calculate daily progress (8 hours = 480 minutes)
  const dailyTargetMinutes = 480;
  const totalWorkedToday = sessionState.totalWorkedToday;
  const totalBreakToday = sessionState.totalBreakToday;
  const progressPercentage = Math.min((totalWorkedToday / dailyTargetMinutes) * 100, 100);

  // Calculate overtime
  const overtimeMinutes = Math.max(0, totalWorkedToday - dailyTargetMinutes);
  const isOvertime = overtimeMinutes > 0;

  // Compliance status
  const needsMealBreak = breakRequirements.requiresMealBreak;
  const hasComplianceIssues = needsMealBreak || breakRequirements.complianceMessage;

  // Current session info
  const isWorking = sessionState.isActive && !sessionState.isOnBreak;
  const isOnBreak = sessionState.isActive && sessionState.isOnBreak;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Progress Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Today's Progress</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isWorking && (
                <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Working
                </Badge>
              )}
              {isOnBreak && (
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                  <Coffee className="h-3 w-3 mr-1" />
                  On Break
                </Badge>
              )}
              {!sessionState.isActive && (
                <Badge variant="outline">
                  Ready to Clock In
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Target Progress</span>
              <span className="font-medium">
                {formatHoursMinutes(totalWorkedToday)} / {formatHoursMinutes(dailyTargetMinutes)}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-muted"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>4h</span>
              <span>8h (Target)</span>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Worked Time
              </div>
              <div className="text-xl font-bold text-foreground">
                {formatHoursMinutes(totalWorkedToday)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coffee className="h-4 w-4" />
                Break Time
              </div>
              <div className="text-xl font-bold text-accent">
                {formatHoursMinutes(totalBreakToday)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                Current Session
              </div>
              <div className="text-xl font-bold text-primary">
                {isWorking ? formatHoursMinutes(sessionState.workElapsedMinutes) : 
                 isOnBreak ? formatHoursMinutes(sessionState.breakElapsedMinutes) : '0h 0m'}
              </div>
            </div>

            {isOvertime && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Overtime
                </div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatHoursMinutes(overtimeMinutes)}
                </div>
              </div>
            )}
          </div>

          {/* Current Session Details */}
          {sessionState.isActive && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    isWorking ? "bg-green-500" : "bg-orange-500"
                  )} />
                  <div>
                    <p className="font-medium">
                      {isWorking ? "Working Session Active" : "Break Session Active"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Started {new Date().toLocaleTimeString()} • 
                      {isWorking ? formatHoursMinutes(sessionState.workElapsedMinutes) : 
                       formatHoursMinutes(sessionState.breakElapsedMinutes)} elapsed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance & Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              hasComplianceIssues 
                ? "bg-orange-500/10 text-orange-600" 
                : "bg-green-500/10 text-green-600"
            )}>
              {hasComplianceIssues ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Compliance</h3>
              <p className="text-sm text-muted-foreground">CA Labor Law</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compliance Status */}
          <div className={cn(
            "p-3 rounded-lg",
            hasComplianceIssues 
              ? "bg-orange-500/10 border border-orange-200 dark:border-orange-800" 
              : "bg-green-500/10 border border-green-200 dark:border-green-800"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {hasComplianceIssues ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                hasComplianceIssues ? "text-orange-800 dark:text-orange-200" : "text-green-800 dark:text-green-200"
              )}>
                {hasComplianceIssues ? "Action Required" : "Compliant"}
              </span>
            </div>
            <p className={cn(
              "text-xs",
              hasComplianceIssues ? "text-orange-700 dark:text-orange-300" : "text-green-700 dark:text-green-300"
            )}>
              {hasComplianceIssues 
                ? needsMealBreak && sessionState.totalBreakToday < 30
                  ? "Meal break required (30 min unpaid)"
                  : "Additional rest breaks recommended"
                : "All break requirements met"
              }
            </p>
          </div>

          <Separator />

          {/* Break Requirements */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Break Requirements</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Break Available:</span>
                <Badge variant="outline" className="text-xs">
                  {breakRequirements.canTakeBreak ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {needsMealBreak && (
                <div className="flex justify-between items-center text-sm">
                  <span>Meal Break Required:</span>
                  <Badge variant="outline" className="text-xs">
                    30min
                  </Badge>
                </div>
              )}
              
              {breakRequirements.suggestedBreakType && (
                <div className="flex justify-between items-center text-sm">
                  <span>Suggested Break:</span>
                  <Badge variant="outline" className="text-xs">
                    {breakRequirements.suggestedBreakType}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Daily Statistics */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Today's Statistics</h4>
            
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sessions Completed:</span>
                  <span className="font-medium">{todayEntries.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Efficiency Rating:</span>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-primary" />
                    <span className="font-medium text-primary">
                      {Math.round((totalWorkedToday / (totalWorkedToday + totalBreakToday)) * 100) || 0}%
                    </span>
                  </div>
                </div>
              
              {isOvertime && (
                <div className="flex justify-between">
                  <span>Overtime Hours:</span>
                  <span className="font-medium text-orange-600">
                    {formatHoursMinutes(overtimeMinutes)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDailyDashboard;