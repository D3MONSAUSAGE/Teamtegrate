
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Coffee, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { DailySummary, CurrentSession } from '@/contexts/TimeTrackingContext';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface EmployeeDailySummaryProps {
  dailySummary: DailySummary | null;
  currentSession: CurrentSession;
}

const EmployeeDailySummary: React.FC<EmployeeDailySummaryProps> = ({
  dailySummary,
  currentSession
}) => {
  const totalWorkMinutes = (dailySummary?.total_work_minutes || 0) + 
    (currentSession.isActive ? currentSession.elapsedMinutes : 0);
  
  const totalBreakMinutes = (dailySummary?.total_break_minutes || 0) + 
    (currentSession.isOnBreak ? currentSession.breakElapsedMinutes : 0);

  const standardWorkDay = 480; // 8 hours
  const progressPercentage = Math.min((totalWorkMinutes / standardWorkDay) * 100, 100);
  
  const overtimeMinutes = Math.max(0, totalWorkMinutes - standardWorkDay);
  const isOvertime = overtimeMinutes > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Summary
          {dailySummary?.is_approved && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Daily Progress</span>
            <span className="font-medium">
              {formatHoursMinutes(totalWorkMinutes)} / {formatHoursMinutes(standardWorkDay)}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {isOvertime && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Overtime: {formatHoursMinutes(overtimeMinutes)}
            </div>
          )}
        </div>

        {/* Time Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">Work Time</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatHoursMinutes(totalWorkMinutes)}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium">Break Time</span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {formatHoursMinutes(totalBreakMinutes)}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium">Sessions</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {(dailySummary?.session_count || 0) + (currentSession.isActive ? 1 : 0)}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium">Breaks</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {(dailySummary?.break_count || 0) + (currentSession.isOnBreak ? 1 : 0)}
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Labor Law Compliance</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Meal Break Compliance */}
            <div className={`p-3 rounded-lg border ${
              totalWorkMinutes > 300 && totalBreakMinutes < 30
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {totalWorkMinutes > 300 && totalBreakMinutes < 30 ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className="text-xs font-medium">Meal Break (30 min after 5h)</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {totalWorkMinutes > 300 
                  ? (totalBreakMinutes >= 30 ? 'Compliant' : 'Required - Take meal break')
                  : 'Not yet required'
                }
              </div>
            </div>

            {/* Rest Break Compliance */}
            <div className={`p-3 rounded-lg border ${
              totalWorkMinutes > 240 && (dailySummary?.break_count || 0) === 0
                ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {totalWorkMinutes > 240 && (dailySummary?.break_count || 0) === 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className="text-xs font-medium">Rest Breaks (10 min per 4h)</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {totalWorkMinutes > 240 
                  ? ((dailySummary?.break_count || 0) > 0 ? 'Compliant' : 'Take rest break')
                  : 'Not yet required'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Notes */}
        {dailySummary?.compliance_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Compliance Issues
              </span>
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">
              {dailySummary.compliance_notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeDailySummary;
