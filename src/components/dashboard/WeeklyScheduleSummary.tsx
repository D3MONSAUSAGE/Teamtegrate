import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, Target, TrendingUp } from 'lucide-react';
import { useEmployeeWeeklySchedule } from '@/hooks/useEmployeeWeeklySchedule';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { startOfWeek, format } from 'date-fns';

interface WeeklyScheduleSummaryProps {
  weekDate?: Date;
}

export const WeeklyScheduleSummary: React.FC<WeeklyScheduleSummaryProps> = ({ 
  weekDate = new Date() 
}) => {
  const { scheduledHours, isLoading: scheduleLoading } = useEmployeeWeeklySchedule(weekDate);
  const { weeklyEntries, isLoading: timeLoading } = useEmployeeTimeTracking();

  // Get the Monday of the week
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });

  // Calculate total tracked hours for the week
  const totalTrackedMinutes = weeklyEntries.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0);
  }, 0);

  const totalTrackedHours = totalTrackedMinutes / 60;
  const scheduledHoursDecimal = scheduledHours;
  const progressPercentage = scheduledHoursDecimal > 0 
    ? Math.min((totalTrackedHours / scheduledHoursDecimal) * 100, 100) 
    : 0;

  const remainingHours = Math.max(scheduledHoursDecimal - totalTrackedHours, 0);
  const isOvertime = totalTrackedHours > scheduledHoursDecimal;

  if (scheduleLoading || timeLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading weekly summary...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Summary
          </h3>
          <div className="text-sm text-muted-foreground">
            Week of {format(weekStart, 'MMM dd, yyyy')}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className={isOvertime ? "text-orange-600" : ""}>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scheduled Hours */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-lg font-semibold">
                {formatHoursMinutes(scheduledHoursDecimal * 60)}
              </p>
            </div>
          </div>

          {/* Tracked Hours */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tracked</p>
              <p className="text-lg font-semibold">
                {formatHoursMinutes(totalTrackedMinutes)}
              </p>
            </div>
          </div>

          {/* Remaining/Overtime */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              isOvertime ? 'bg-orange-500/10' : 'bg-blue-500/10'
            }`}>
              <TrendingUp className={`h-5 w-5 ${
                isOvertime ? 'text-orange-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isOvertime ? 'Overtime' : 'Remaining'}
              </p>
              <p className={`text-lg font-semibold ${
                isOvertime ? 'text-orange-600' : ''
              }`}>
                {isOvertime 
                  ? formatHoursMinutes((totalTrackedHours - scheduledHoursDecimal) * 60)
                  : formatHoursMinutes(remainingHours * 60)
                }
              </p>
            </div>
          </div>
        </div>

        {/* Weekly entries count */}
        <div className="text-sm text-muted-foreground text-center">
          {weeklyEntries.length} time {weeklyEntries.length === 1 ? 'entry' : 'entries'} this week
        </div>
      </div>
    </Card>
  );
};